'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import Image from 'next/image';
import LinkButton from '@/components/LinkButton';
import Modal from '@/components/Modal';
import ProductSelector from '@/components/ProductSelector';
import JsonHighlight from '@/components/JsonHighlight';
import CodeEditor from '@uiw/react-textarea-code-editor';
import SettingsToggle from '@/components/SettingsToggle';
import ArrowButton from '@/components/ArrowButton';
import { PRODUCTS_ARRAY, PRODUCT_CONFIGS, getProductConfigById } from '@/lib/productConfig';

export default function Home() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedChildProduct, setSelectedChildProduct] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [modalState, setModalState] = useState<'loading' | 'preview-config' | 'callback-success' | 'callback-exit' | 'callback-exit-zap' | 'accounts-data' | 'processing-accounts' | 'processing-product' | 'success' | 'error' | 'api-error' | 'zap-mode-results' | 'tidying-up'>('loading');
  const [accountsData, setAccountsData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [callbackData, setCallbackData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorData, setErrorData] = useState<any>(null);
  const [apiStatusCode, setApiStatusCode] = useState<number>(200);
  const [linkEvents, setLinkEvents] = useState<any[]>([]);
  const [showEventLogs, setShowEventLogs] = useState(false);
  const [eventLogsCopied, setEventLogsCopied] = useState(false);
  const eventLogsRef = useRef<HTMLDivElement>(null);
  const [linkTokenConfig, setLinkTokenConfig] = useState<any>(null);
  const [eventLogsPosition, setEventLogsPosition] = useState<'left' | 'right'>('right');
  const [isTransitioningModals, setIsTransitioningModals] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editedConfig, setEditedConfig] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);
  
  // Settings/Configuration state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [zapMode, setZapMode] = useState(false);
  const [embeddedMode, setEmbeddedMode] = useState(false);
  const [layerMode, setLayerMode] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [tempZapMode, setTempZapMode] = useState(false);
  const [tempEmbeddedMode, setTempEmbeddedMode] = useState(false);
  const [tempLayerMode, setTempLayerMode] = useState(false);
  const [tempDemoMode, setTempDemoMode] = useState(false);
  const hasCustomSettings = zapMode || embeddedMode || layerMode || demoMode;
  const [showZapResetButton, setShowZapResetButton] = useState(false);
  
  // Demo Mode state
  const [demoLinkCompleted, setDemoLinkCompleted] = useState(false);
  const [demoAccessToken, setDemoAccessToken] = useState<string | null>(null);
  const [showDemoProductsModal, setShowDemoProductsModal] = useState(false);
  const [demoProductsVisibility, setDemoProductsVisibility] = useState<Record<string, boolean>>({});
  const [isDemoModeStarting, setIsDemoModeStarting] = useState(false);

  // Initialize all products as visible for Demo Mode
  const initializeProductVisibility = () => {
    const visibility: Record<string, boolean> = {};
    PRODUCTS_ARRAY.forEach(product => {
      visibility[product.id] = true;
      if (product.children) {
        product.children.forEach(child => {
          visibility[child.id] = true;
        });
      }
    });
    return visibility;
  };

  // Don't fetch link token on mount - wait for product selection
  // useEffect removed - link token fetched after product selection

  // Welcome animation sequence
  useEffect(() => {
    // Only run if showWelcome is true (on natural page load)
    if (!showWelcome) {
      // If welcome is already false, show button immediately
      setShowButton(true);
      return;
    }

    // Remove welcome text after animation completes (5 seconds)
    const welcomeTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 2800);

    // Show button after welcome fades out (5 seconds total)
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 5000);

    return () => {
      clearTimeout(welcomeTimer);
      clearTimeout(buttonTimer);
    };
  }, [showWelcome]);

  // Auto-scroll event logs to bottom when new events arrive
  useEffect(() => {
    if (eventLogsRef.current && linkEvents.length > 0) {
      eventLogsRef.current.scrollTop = eventLogsRef.current.scrollHeight;
    }
  }, [linkEvents]);

  const fetchLinkToken = async (productId: string) => {
    try {
      const productConfig = getProductConfigById(productId);
      if (!productConfig) {
        throw new Error('Product configuration not found');
      }
      
      const requestBody: any = {
        products: productConfig.products,
        required_if_supported_products: productConfig.required_if_supported
      };

      // Add additional link params if they exist (e.g., days_requested for transactions sync)
      if (productConfig.additionalLinkParams) {
        Object.assign(requestBody, productConfig.additionalLinkParams);
      }

      const response = await fetch('/api/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      // Check for API errors
      if (response.status >= 400) {
        setErrorData(data);
        setApiStatusCode(response.status);
        setModalState('api-error');
        setShowModal(true);
        setShowWelcome(false);
        return;
      }
      
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error fetching link token:', error);
      setErrorMessage('Failed to initialize. Please try again.');
      setModalState('error');
      setShowModal(true);
      setShowWelcome(false);
      
      // Reset after a delay
      setTimeout(() => {
        setShowModal(false);
        setModalState('loading');
        setShowProductModal(true);
      }, 3000);
    }
  };

  const handleProductSelect = (productId: string) => {
    const productConfig = PRODUCT_CONFIGS[productId];
    
    // If product has children, show child selection modal
    if (productConfig?.children && productConfig.children.length > 0) {
      setSelectedProduct(productId);
      setShowProductModal(false);
      setShowChildModal(true);
    } else {
      // Direct product
      setSelectedProduct(productId);
      setSelectedChildProduct(null);
      setShowProductModal(false);
      
      // If in Demo Mode with Link completed, call API directly
      if (demoLinkCompleted) {
        handleDemoModeApiCall(productId);
      } else {
        // Normal mode: show preview modal
        showLinkConfigPreview(productId);
      }
    }
  };

  const handleChildProductSelect = (childId: string) => {
    setSelectedChildProduct(childId);
    setShowChildModal(false);
    
    // If in Demo Mode with Link completed, call API directly
    if (demoLinkCompleted) {
      handleDemoModeApiCall(childId);
    } else {
      // Normal mode: show preview modal
      showLinkConfigPreview(childId);
    }
  };

  const showLinkConfigPreview = (productId: string) => {
    const productConfig = getProductConfigById(productId);
    if (!productConfig) {
      return;
    }

    // Build the FULL configuration that will be sent to Plaid
    const fullConfig: any = {
      link_customization_name: 'flash',
      user: {
        client_user_id: 'flash_user_id01',
        phone_number: '+14155550011'
      },
      client_name: 'Plaid Flash',
      products: productConfig.products,
      country_codes: ['US'],
      language: 'en'
    };

    // Add required_if_supported_products if not empty
    if (productConfig.required_if_supported && productConfig.required_if_supported.length > 0) {
      fullConfig.required_if_supported_products = productConfig.required_if_supported;
    }

    // Add additional link params if they exist (e.g., days_requested for transactions sync)
    if (productConfig.additionalLinkParams) {
      Object.assign(fullConfig, productConfig.additionalLinkParams);
    }

    setLinkTokenConfig(fullConfig);
    
    // In Zap Mode, bypass the preview modal and go straight to opening Link
    if (zapMode) {
      handleProceedWithConfig(fullConfig); // Pass config directly to avoid state timing issues
    } else {
      setModalState('preview-config');
      setShowModal(true);
    }
  };

  const handleProceedWithConfig = async (configOverride?: any) => {
    // User approved the config, now fetch the link token using the (potentially edited) linkTokenConfig
    // In Zap Mode, configOverride is passed directly to avoid state timing issues
    setShowModal(false);
    
    // If we're starting Demo Mode, trigger the UI changes now
    if (isDemoModeStarting) {
      setShowButton(false);
      setShowEventLogs(true);
      setEventLogsPosition('right');
      setIsDemoModeStarting(false); // Reset the flag
    }
    
    try {
      // Use the configOverride if provided (Zap Mode), otherwise use linkTokenConfig state
      const configToUse = configOverride || linkTokenConfig;
      const response = await fetch('/api/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToUse),
      });
      
      const data = await response.json();
      
      // Check for API errors
      if (response.status >= 400) {
        setErrorData(data);
        setApiStatusCode(response.status);
        setModalState('api-error');
        setShowModal(true);
        setShowWelcome(false);
        return;
      }
      
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error fetching link token:', error);
      setErrorMessage('Failed to initialize. Please try again.');
      setModalState('error');
      setShowModal(true);
      setShowWelcome(false);
      
      // Reset after a delay
      setTimeout(() => {
        setShowModal(false);
        setModalState('loading');
        setShowProductModal(true);
      }, 3000);
    }
  };

  const handleGoBackToProducts = () => {
    // User wants to change product selection
    setShowModal(false);
    setLinkTokenConfig(null);
    setModalState('loading');
    setIsEditingConfig(false);
    setConfigError(null);
    
    // Reset demo mode starting flag if it was set
    if (isDemoModeStarting) {
      setIsDemoModeStarting(false);
    }
    
    // If we came from child selection, go back to child modal
    // Otherwise go back to parent product modal
    if (selectedChildProduct) {
      setSelectedChildProduct(null);
      setShowChildModal(true);
    } else {
      setSelectedProduct(null);
      setShowProductModal(true);
    }
  };

  const handleToggleEditMode = () => {
    if (!isEditingConfig) {
      // Entering edit mode - populate editedConfig with current config
      setEditedConfig(JSON.stringify(linkTokenConfig, null, 2));
      setConfigError(null);
    }
    setIsEditingConfig(!isEditingConfig);
  };

  const handleSaveConfig = () => {
    try {
      const parsed = JSON.parse(editedConfig);
      setLinkTokenConfig(parsed);
      setConfigError(null);
      setIsEditingConfig(false);
      return true;
    } catch (error: any) {
      setConfigError(`Invalid JSON: ${error.message}`);
      return false;
    }
  };

  const handleCancelEdit = () => {
    setIsEditingConfig(false);
    setConfigError(null);
    setEditedConfig('');
  };

  const handleSaveAndProceed = async () => {
    try {
      // Validate JSON first
      const parsed = JSON.parse(editedConfig);
      
      // Close modal immediately to avoid showing read-only view
      setShowModal(false);
      
      // Update config and reset edit state
      setLinkTokenConfig(parsed);
      setConfigError(null);
      setIsEditingConfig(false);
      
      // Proceed with link token creation
      try {
        const response = await fetch('/api/create-link-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsed),
        });
        
        const data = await response.json();
        
        // Check for API errors
        if (response.status >= 400) {
          setErrorData(data);
          setApiStatusCode(response.status);
          setModalState('api-error');
          setShowModal(true);
          setShowWelcome(false);
          return;
        }
        
        setLinkToken(data.link_token);
      } catch (error) {
        console.error('Error fetching link token:', error);
        setErrorMessage('Failed to initialize. Please try again.');
        setModalState('error');
        setShowModal(true);
        setShowWelcome(false);
        
        // Reset after a delay
        setTimeout(() => {
          setShowModal(false);
          setModalState('loading');
          setShowProductModal(true);
        }, 3000);
      }
    } catch (error: any) {
      setConfigError(`Invalid JSON: ${error.message}`);
    }
  };

  // Settings Modal Handlers
  const handleOpenSettings = () => {
    // Copy current settings to temp state
    setTempZapMode(zapMode);
    setTempEmbeddedMode(embeddedMode);
    setTempLayerMode(layerMode);
    setTempDemoMode(demoMode);
    // Hide product modal and show settings modal
    setShowProductModal(false);
    setShowChildModal(false);
    setShowSettingsModal(true);
  };

  const handleCancelSettings = () => {
    // Discard changes and close settings modal
    setShowSettingsModal(false);
    // Restore the appropriate product modal
    if (selectedProduct && PRODUCT_CONFIGS[selectedProduct]?.children && selectedChildProduct) {
      setShowChildModal(true);
    } else {
      setShowProductModal(true);
    }
  };

  const handleSaveSettings = () => {
    // Commit temp state to main state
    const wasDemoMode = demoMode;
    const willBeDemoMode = tempDemoMode;
    
    setZapMode(tempZapMode);
    setEmbeddedMode(tempEmbeddedMode);
    setLayerMode(tempLayerMode);
    setDemoMode(tempDemoMode);
    
    // Close settings modal
    setShowSettingsModal(false);
    
    // If Demo Mode is enabled and Link not yet completed, show product selector modal
    if (willBeDemoMode && !demoLinkCompleted) {
      setDemoProductsVisibility(initializeProductVisibility());
      setShowDemoProductsModal(true);
    } else {
      // Otherwise restore the appropriate product modal
      if (selectedProduct && PRODUCT_CONFIGS[selectedProduct]?.children && selectedChildProduct) {
        setShowChildModal(true);
      } else {
        setShowProductModal(true);
      }
    }
  };

  const handleToggleZap = () => {
    const newValue = !tempZapMode;
    setTempZapMode(newValue);
    // Zap and Demo are mutually exclusive
    if (newValue) {
      setTempDemoMode(false);
    }
  };

  const handleToggleEmbedded = () => {
    // Disabled for now, but handler exists
    if (!true) { // Will enable later
      setTempEmbeddedMode(!tempEmbeddedMode);
    }
  };

  const handleToggleLayer = () => {
    // Disabled for now, but handler exists
    if (!true) { // Will enable later
      setTempLayerMode(!tempLayerMode);
    }
  };

  const handleToggleDemo = () => {
    const newValue = !tempDemoMode;
    setTempDemoMode(newValue);
    // Zap and Demo are mutually exclusive
    if (newValue) {
      setTempZapMode(false);
    }
  };

  const handleToggleDemoProduct = (productId: string) => {
    setDemoProductsVisibility(prevVisibility => {
      const newVisibility = { ...prevVisibility };
      const currentValue = newVisibility[productId];
      const newValue = !currentValue;
      
      // Find if this is a parent or child product
      const parentProduct = PRODUCTS_ARRAY.find(p => p.id === productId);
      const isParent = !!parentProduct;
      
      if (isParent) {
        // Toggle parent
        newVisibility[productId] = newValue;
        
        // Cascade to children
        if (parentProduct.children) {
          parentProduct.children.forEach(child => {
            newVisibility[child.id] = newValue;
          });
        }
      } else {
        // This is a child - find its parent
        const parent = PRODUCTS_ARRAY.find(p => 
          p.children?.some(c => c.id === productId)
        );
        
        if (parent) {
          // Toggle the child
          newVisibility[productId] = newValue;
          
          if (newValue) {
            // If enabling a child, enable parent
            newVisibility[parent.id] = true;
          } else {
            // If disabling a child, check if all siblings are disabled
            const allChildrenDisabled = parent.children?.every(
              child => !newVisibility[child.id]
            );
            
            if (allChildrenDisabled) {
              newVisibility[parent.id] = false;
            }
          }
        }
      }
      
      return newVisibility;
    });
  };

  const handleDemoProductsGo = () => {
    // Validate at least one product is enabled
    const hasEnabledProduct = Object.values(demoProductsVisibility).some(v => v);
    
    if (!hasEnabledProduct) {
      return; // Button should be disabled, but extra safety check
    }
    
    // Close the products modal
    setShowDemoProductsModal(false);
    
    // Start the Demo Mode flow
    handleDemoModeStart();
  };

  const handleCancelDemoProducts = () => {
    // Close products modal and return to settings
    setShowDemoProductsModal(false);
    setShowSettingsModal(true);
  };

  const handleZapModeSuccess = useCallback(async (public_token: string, metadata: any) => {
    // Zap Mode: skip callback modal, go straight to API calls
    setModalState('processing-accounts');
    setShowModal(true);

    try {
      // Exchange public token for access token
      const exchangeResponse = await fetch('/api/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token }),
      });
      
      if (!exchangeResponse.ok) {
        const errorData = await exchangeResponse.json();
        setErrorData(errorData);
        setApiStatusCode(exchangeResponse.status);
        setModalState('api-error');
        setShowModal(true);
        return;
      }

      const { access_token } = await exchangeResponse.json();
      setAccessToken(access_token);

      // Get the effective product ID (child if selected, otherwise parent)
      const effectiveProductId = selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);

      // Skip accounts/get for Signal Balance
      const skipAccountsGet = effectiveProductId === 'signal-balance';

      if (!skipAccountsGet) {
        // Get accounts data
        const accountsResponse = await fetch('/api/accounts-get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token }),
        });

        const accountsData = await accountsResponse.json();
        
        // Check for API errors
        if (accountsResponse.status >= 400) {
          setErrorData(accountsData);
          setApiStatusCode(accountsResponse.status);
          setModalState('api-error');
          setShowModal(true);
          return;
        }
        
        setAccountsData(accountsData);
        setApiStatusCode(accountsResponse.status);
      }

      // Update loading message for product call
      setModalState('processing-product');
      
      if (!productConfig || !productConfig.apiEndpoint) {
        throw new Error('Product API endpoint not configured');
      }

      // Build request body with access token and any additional params
      const requestBody: any = { access_token };
      if (productConfig.additionalApiParams) {
        Object.assign(requestBody, productConfig.additionalApiParams);
      }
      
      const productResponse = await fetch(productConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const productData = await productResponse.json();
      
      // Check for API errors
      if (productResponse.status >= 400) {
        setErrorData(productData);
        setApiStatusCode(productResponse.status);
        setModalState('api-error');
        setShowModal(true);
        return;
      }
      
      setProductData(productData);
      
      // Show Zap Mode results (side-by-side modals)
      setModalState('zap-mode-results');
      setShowModal(false); // Hide main modal overlay
      setShowZapResetButton(true);
    } catch (error) {
      console.error('Error in Zap Mode success flow:', error);
      setErrorMessage('We encountered an issue. Please try again.');
      setModalState('error');
      setShowModal(true);
    }
  }, [selectedProduct, selectedChildProduct]);

  const onSuccess = useCallback((public_token: string, metadata: any) => {
    // Hide the button
    setShowButton(false);
    
    if (zapMode) {
      // Zap Mode: skip callback modal, go directly to API calls
      handleZapModeSuccess(public_token, metadata);
    } else {
      // Default mode and Demo Mode: slide event logs to the left and show callback modal
      setEventLogsPosition('left');
      setShowModal(true);
      setModalState('callback-success');
      setCallbackData({
        public_token,
        metadata
      });
    }
  }, [zapMode, demoMode, handleZapModeSuccess]);

  const handleProceedWithSuccess = async () => {
    // Start fade-out animation for both modals
    setIsTransitioningModals(true);
    
    // Wait for fade-out animation to complete (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Hide both modals and reset event logs
    setShowEventLogs(false);
    setShowModal(false);
    setEventLogsPosition('right');
    setIsTransitioningModals(false);
    
    // Show processing state for accounts
    setModalState('processing-accounts');
    setShowModal(true);

    try {
      const { public_token } = callbackData;

      // Exchange public token for access token
      const exchangeResponse = await fetch('/api/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token }),
      });
      
      if (!exchangeResponse.ok) {
        const errorData = await exchangeResponse.json();
        setErrorData(errorData);
        setApiStatusCode(exchangeResponse.status);
        setModalState('api-error');
        return;
      }

      const { access_token } = await exchangeResponse.json();

      // Store access token for cleanup
      setAccessToken(access_token);

      // If in Demo Mode, store access token and show product selector
      if (demoMode) {
        setDemoAccessToken(access_token);
        setDemoLinkCompleted(true);
        setShowModal(false);
        setShowProductModal(true);
        return;
      }

      // Get the effective product ID to check if we should skip accounts/get
      const effectiveProductId = selectedChildProduct || selectedProduct;
      const skipAccountsGet = effectiveProductId === 'signal-balance';

      if (skipAccountsGet) {
        // Skip accounts/get for Signal Balance and go directly to product API
        setModalState('processing-product');
        
        const productConfig = getProductConfigById(effectiveProductId!);
        
        if (!productConfig || !productConfig.apiEndpoint) {
          throw new Error('Product API endpoint not configured');
        }

        // Build request body with access token and any additional params
        const requestBody: any = { access_token };
        if (productConfig.additionalApiParams) {
          Object.assign(requestBody, productConfig.additionalApiParams);
        }
        
        const productResponse = await fetch(productConfig.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const productData = await productResponse.json();
        
        // Check for API errors
        if (productResponse.status >= 400) {
          setErrorData(productData);
          setApiStatusCode(productResponse.status);
          setModalState('api-error');
          return;
        }
        
        setProductData(productData);
        setApiStatusCode(productResponse.status);
        setModalState('success');
      } else {
        // Get accounts data
        const accountsResponse = await fetch('/api/accounts-get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token }),
        });

        const accountsData = await accountsResponse.json();
        
        // Check for API errors
        if (accountsResponse.status >= 400) {
          setErrorData(accountsData);
          setApiStatusCode(accountsResponse.status);
          setModalState('api-error');
          return;
        }
        
        // Update state to show accounts data
        setAccountsData(accountsData);
        setApiStatusCode(accountsResponse.status);
        setModalState('accounts-data');
      }
    } catch (error) {
      console.error('Error processing account:', error);
      setErrorMessage('We encountered an issue connecting your account. Please try again.');
      setModalState('error');
      
      // Reset after a delay
      setTimeout(() => {
        setShowModal(false);
        setCallbackData(null);
        setAccountsData(null);
        setProductData(null);
        setModalState('loading');
        setShowButton(true);
        setShowWelcome(false);
        setShowProductModal(true);
      }, 3000);
    }
  };

  const handleCallProduct = async () => {
    // Show processing state for product
    setModalState('processing-product');

    try {
      // Get the effective product ID (child if selected, otherwise parent)
      const effectiveProductId = selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      
      if (!productConfig || !productConfig.apiEndpoint) {
        throw new Error('Product API endpoint not configured');
      }

      // Build request body with access token and any additional params
      const requestBody: any = { access_token: accessToken };
      if (productConfig.additionalApiParams) {
        Object.assign(requestBody, productConfig.additionalApiParams);
      }
      
      const productResponse = await fetch(productConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const productData = await productResponse.json();
      
      // Check for API errors
      if (productResponse.status >= 400) {
        setErrorData(productData);
        setApiStatusCode(productResponse.status);
        setModalState('api-error');
        return;
      }
      
      // Update state to show product data
      setProductData(productData);
      setApiStatusCode(productResponse.status);
      setModalState('success');
    } catch (error) {
      console.error('Error fetching product data:', error);
      setErrorMessage('We encountered an issue fetching product data. Please try again.');
      setModalState('error');
      
      // Reset after a delay
      setTimeout(() => {
        setShowModal(false);
        setCallbackData(null);
        setAccountsData(null);
        setProductData(null);
        setModalState('loading');
        setShowButton(true);
        setShowWelcome(false);
        setShowProductModal(true);
      }, 3000);
    }
  };

  const handleBackToProducts = () => {
    // Clear current product data
    setProductData(null);
    setAccountsData(null);
    setSelectedProduct(null);
    setSelectedChildProduct(null);
    
    // Hide success modal and show product selector
    setShowModal(false);
    setShowProductModal(true);
    
    // Keep demoLinkCompleted and demoAccessToken intact for next product selection
  };

  const handleDemoModeApiCall = async (productId: string) => {
    // Show processing state for product
    setModalState('processing-product');
    setShowModal(true);

    try {
      const productConfig = getProductConfigById(productId);
      
      if (!productConfig || !productConfig.apiEndpoint) {
        throw new Error('Product API endpoint not configured');
      }

      // In Demo Mode, we may need to call /accounts/get first for some products
      // Check if we should skip accounts/get (same logic as normal mode)
      const skipAccountsGet = productId === 'signal-balance';

      let accountsData = null;

      if (!skipAccountsGet) {
        // Call /accounts/get first
        const accountsResponse = await fetch('/api/accounts-get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: demoAccessToken }),
        });

        accountsData = await accountsResponse.json();
        
        // Check for API errors
        if (accountsResponse.status >= 400) {
          setErrorData(accountsData);
          setApiStatusCode(accountsResponse.status);
          setModalState('api-error');
          return;
        }
        
        setAccountsData(accountsData);
      }

      // Build request body with access token and any additional params
      const requestBody: any = { access_token: demoAccessToken };
      if (productConfig.additionalApiParams) {
        Object.assign(requestBody, productConfig.additionalApiParams);
      }
      
      const productResponse = await fetch(productConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const productData = await productResponse.json();
      
      // Check for API errors
      if (productResponse.status >= 400) {
        setErrorData(productData);
        setApiStatusCode(productResponse.status);
        setModalState('api-error');
        return;
      }
      
      // Update state to show product data
      setProductData(productData);
      setApiStatusCode(productResponse.status);
      setModalState('success');
    } catch (error) {
      console.error('Error fetching product data in Demo Mode:', error);
      setErrorMessage('We encountered an issue fetching product data. Please try again.');
      setModalState('error');
      
      // In Demo Mode, on error, return to product selector instead of full reset
      setTimeout(() => {
        setShowModal(false);
        setProductData(null);
        setAccountsData(null);
        setModalState('loading');
        setShowProductModal(true);
      }, 3000);
    }
  };

  const onExit = useCallback((err: any, metadata: any) => {
    // Hide button
    setShowButton(false);
    
    if (!zapMode) {
      // Default mode: slide event logs to the left (Link's position)
      setEventLogsPosition('left');
    }
    
    // Show callback data modal for exit
    setShowModal(true);
    setModalState(zapMode ? 'callback-exit-zap' : 'callback-exit');
    setCallbackData({
      err: err || null,
      metadata
    });
  }, [zapMode]);

  const onEvent = useCallback((eventName: string, metadata: any) => {
    // Add event to the logs
    const eventData = {
      timestamp: new Date().toISOString(),
      eventName,
      metadata
    };
    console.log('Link Event:', eventData);
    setLinkEvents(prevEvents => [
      ...prevEvents,
      eventData
    ]);
  }, []);

  const handleExitRetry = async () => {
    // Start fade-out animation for both modals
    setIsTransitioningModals(true);
    
    // Wait for fade-out animation to complete (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Hide both modals and reset state
    setShowModal(false);
    setShowEventLogs(false);
    setEventLogsPosition('right');
    setIsTransitioningModals(false);
    setCallbackData(null);
    setModalState('loading');
    setShowButton(true);
    setShowWelcome(false);
    // Clear link token and selected products to prevent auto-opening
    setLinkToken(null);
    setSelectedProduct(null);
    setSelectedChildProduct(null);
    setLinkEvents([]);
    setShowProductModal(true);
  };

  const config = {
    token: linkToken,
    onSuccess,
    onExit,
    onEvent,
  };

  const { open, ready } = usePlaidLink(config);

  // Auto-open Link when ready after product selection
  useEffect(() => {
    // In Demo Mode, we can open Link without a selected product
    // In normal mode, we need a selected product
    const shouldOpenLink = ready && linkToken && !showModal && !showChildModal && !showProductModal && !showZapResetButton && 
      (demoMode || selectedProduct || selectedChildProduct);
    
    if (shouldOpenLink) {
      // Clear previous events and show event logs (unless in Zap Mode)
      setLinkEvents([]);
      if (!zapMode) {
        setShowEventLogs(true);
      }
      setShowProductModal(false); // Ensure product modal is hidden
      open();
    }
  }, [ready, linkToken, selectedProduct, selectedChildProduct, showModal, showChildModal, showProductModal, showZapResetButton, zapMode, demoMode, open]);

  const handleButtonClick = () => {
    // Show product selection modal instead of opening Link directly
    setShowButton(false);
    setShowProductModal(true);
  };

  const handleDemoModeStart = async () => {
    // Build products array dynamically based on enabled products
    const enabledProductIds = Object.keys(demoProductsVisibility).filter(
      id => demoProductsVisibility[id]
    );
    
    const productsSet = new Set<string>();
    
    enabledProductIds.forEach(productId => {
      // Check if it's a parent product
      const parentProduct = PRODUCTS_ARRAY.find(p => p.id === productId);
      
      if (parentProduct) {
        // It's a parent - add its products
        parentProduct.products.forEach(p => productsSet.add(p));
      } else {
        // It's a child - find its parent
        const parent = PRODUCTS_ARRAY.find(p => 
          p.children?.some(c => c.id === productId)
        );
        
        if (parent) {
          // Add parent's products
          parent.products.forEach(p => productsSet.add(p));
        }
      }
    });
    
    // Convert set to array (automatically de-duplicated)
    const products = Array.from(productsSet);
    
    // Create Link token config with dynamically built products
    const demoConfig = {
      link_customization_name: 'flash',
      user: {
        client_user_id: 'flash_user_id01',
        phone_number: '+14155550011'
      },
      client_name: 'Plaid Flash',
      products,
      transactions: {
        days_requested: 14
      },
      country_codes: ['US'],
      language: 'en'
    };
    
    // Set flag that we're starting demo mode
    setIsDemoModeStarting(true);
    
    // Show config preview modal - when user clicks Proceed, it will continue with demo mode
    setLinkTokenConfig(demoConfig);
    setModalState('preview-config');
    setShowModal(true);
  };

  const handleStartOver = async () => {
    // Hide product selector modals first
    setShowProductModal(false);
    setShowChildModal(false);
    
    // Clean up Plaid item if access token exists
    if (accessToken || demoAccessToken) {
      // Show tidying up message
      setModalState('tidying-up');
      setShowModal(true);
      
      try {
        await fetch('/api/item-remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: accessToken || demoAccessToken }),
        });
      } catch (error) {
        console.error('Error removing item:', error);
        // Continue with reset even if cleanup fails
      }
    }

    // Reset to product selection screen without reloading
    setShowModal(false);
    setAccountsData(null);
    setProductData(null);
    setCallbackData(null);
    setAccessToken(null);
    setSelectedProduct(null);
    setSelectedChildProduct(null);
    setLinkToken(null);
    setLinkEvents([]);
    setShowEventLogs(false);
    setModalState('loading');
    setShowButton(false);
    setShowWelcome(false);
    setShowProductModal(true);
    setErrorData(null);
    setErrorMessage('');
    
    // Reset Demo Mode state completely
    setDemoMode(false);
    setDemoLinkCompleted(false);
    setDemoAccessToken(null);
    setShowDemoProductsModal(false);
    setDemoProductsVisibility({});
  };

  const handleZapReset = async () => {
    // Zap Mode reset: clean up and return to product selection
    if (accessToken) {
      // Show tidying up message
      setModalState('tidying-up');
      setShowModal(true);
      setShowZapResetButton(false);
      
      try {
        await fetch('/api/item-remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: accessToken }),
        });
      } catch (error) {
        console.error('Error removing item:', error);
      }
    }

    // Reset to product selection
    setShowModal(false);
    setAccountsData(null);
    setProductData(null);
    setCallbackData(null);
    setAccessToken(null);
    setSelectedProduct(null);
    setSelectedChildProduct(null);
    setLinkToken(null);
    setLinkEvents([]);
    setShowEventLogs(false);
    setShowZapResetButton(false);
    setModalState('loading');
    setShowButton(false);
    setShowWelcome(false);
    setShowProductModal(true);
  };

  const handleCopyAccessToken = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (accessToken) {
      try {
        await navigator.clipboard.writeText(accessToken);
        // Add visual feedback
        const button = event.currentTarget;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };


  const handleCopyConfig = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (linkTokenConfig) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(linkTokenConfig, null, 2));
        // Add visual feedback
        const button = event.currentTarget;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const renderModalContent = () => {
    if (modalState === 'preview-config' && linkTokenConfig) {
      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>Here&apos;s the /link/token/create configuration that will be used:</h2>
          </div>
          {!isEditingConfig ? (
            <>
              <div className="account-data config-data-with-edit">
                <button 
                  className="config-edit-icon" 
                  onClick={handleToggleEditMode}
                  title="Edit configuration"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <JsonHighlight data={linkTokenConfig} />
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={handleGoBackToProducts} />
                <ArrowButton variant="blue" onClick={() => handleProceedWithConfig()} />
              </div>
            </>
          ) : (
            <>
              <div className="code-editor-container">
                <CodeEditor
                  value={editedConfig}
                  language="json"
                  onChange={(e) => setEditedConfig(e.target.value)}
                  padding={15}
                  data-color-mode="dark"
                  style={{
                    fontSize: 13,
                    fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    minHeight: '400px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                  }}
                />
                {configError && (
                  <div className="config-error">
                    {configError}
                  </div>
                )}
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={handleCancelEdit} />
                <ArrowButton variant="blue" onClick={handleSaveAndProceed} />
              </div>
            </>
          )}
        </div>
      );
    }

    if (modalState === 'callback-success' && callbackData) {
      return (
        <div className="modal-callback">
          <div className="callback-header">
            <div className="callback-icon success-callback">✓</div>
            <h2>onSuccess Callback Fired!</h2>
          </div>
          <p className="callback-description">
            Here&apos;s the data returned from Link:
          </p>
          <div className="account-data">
            <JsonHighlight data={callbackData} />
          </div>
          <div className="modal-button-row single-button">
            <ArrowButton variant="blue" onClick={handleProceedWithSuccess} />
          </div>
        </div>
      );
    }

    if (modalState === 'callback-exit' && callbackData) {
      return (
        <div className="modal-callback">
          <div className="callback-header">
            <div className="callback-icon exit-callback">✕</div>
            <h2>onExit Callback Fired</h2>
          </div>
          <div className="account-data">
            <JsonHighlight data={callbackData} />
          </div>
          <div className="modal-button-row single-button">
            <ArrowButton variant="red" onClick={handleExitRetry} />
          </div>
        </div>
      );
    }

    if (modalState === 'callback-exit-zap' && callbackData) {
      return (
        <div className="modal-callback">
          <div className="callback-header">
            <div className="callback-icon exit-callback">✕</div>
            <h2>onExit Callback Fired</h2>
          </div>
          <div className="account-data">
            <JsonHighlight data={callbackData} />
          </div>
          <div className="button-row">
            <button className="action-button button-red" onClick={handleExitRetry}>
              Try again?
            </button>
          </div>
        </div>
      );
    }

    if (modalState === 'accounts-data' && accountsData) {
      const effectiveProductId = selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      const productName = productConfig?.name || 'Product';
      
      return (
        <div className="modal-success">
          <div className="success-header">
            <div className="success-icon">✓</div>
            <h2>/accounts/get Response</h2>
            {demoLinkCompleted && (
              <button className="reset-icon-button" onClick={handleStartOver} title="Reset Session" style={{ background: 'linear-gradient(135deg, #c7659f 0%, #c43d52 100%)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                </svg>
              </button>
            )}
          </div>
          <div className="account-data">
            <JsonHighlight 
              data={accountsData}
              expandableCopy={{
                responseData: accountsData,
                accessToken: accessToken
              }}
            />
          </div>
          <div className="modal-button-row single-button">
            <ArrowButton variant="blue" onClick={handleCallProduct} />
          </div>
        </div>
      );
    }

    if (modalState === 'processing-accounts') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Exchanging token and fetching account data...</p>
        </div>
      );
    }

    if (modalState === 'processing-product') {
      const effectiveProductId = selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      const productName = productConfig?.name || 'Product';
      
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Fetching {productName} data...</p>
        </div>
      );
    }

    if (modalState === 'tidying-up') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Tidying up</p>
        </div>
      );
    }

    if (modalState === 'error') {
      return (
        <div className="modal-error">
          <div className="error-icon">⚠️</div>
          <p>{errorMessage}</p>
          <p className="error-subtext">Restarting...</p>
        </div>
      );
    }

    if (modalState === 'api-error' && errorData) {
      return (
        <div className="modal-success">
          <div className="success-header">
            <div className="error-icon-large">⚠️</div>
            <h2>API Error Response</h2>
            {apiStatusCode && <span className="status-code">{apiStatusCode}</span>}
          </div>
          <div className="account-data">
            <JsonHighlight 
              data={errorData} 
              showCopyButton={true}
            />
          </div>
          <div className="modal-button-row single-button">
            <ArrowButton variant="red" direction="back" onClick={handleStartOver} />
          </div>
        </div>
      );
    }

    if (modalState === 'success' && productData) {
      const effectiveProductId = selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      const apiTitle = productConfig?.apiTitle || 'API Response';
      
      return (
        <div className="modal-success">
          <div className="success-header">
            <div className="success-icon">✓</div>
            <h2>{apiTitle} Response</h2>
            {demoLinkCompleted && (
              <button className="reset-icon-button" onClick={handleStartOver} title="Reset Session" style={{ background: 'linear-gradient(135deg, #c7659f 0%, #c43d52 100%)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                </svg>
              </button>
            )}
          </div>
          <div className="account-data">
            <JsonHighlight 
              data={productData} 
              highlightKeys={productConfig?.highlightKeys}
              expandableCopy={{
                responseData: productData,
                accessToken: accessToken || demoAccessToken
              }}
            />
          </div>
          {demoLinkCompleted ? (
            // Demo Mode: show "Back to Products" button (reset is in header)
            <div className="modal-button-row single-button">
              <ArrowButton variant="blue" onClick={handleBackToProducts} />
            </div>
          ) : (
            // Normal Mode: show "Start Over" button
            <div className="modal-button-row single-button">
              <ArrowButton variant="blue" onClick={handleStartOver} />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="app">
      {showWelcome && (
        <div className="welcome-text">
          <Image 
            src="/icons/plaid-horizontal.svg" 
            alt="Plaid"
            width={686}
            height={350} 
            className="welcome-plaid-logo"
            priority
          />
        </div>
      )}
      <LinkButton 
        onClick={handleButtonClick} 
        isVisible={showButton && !showWelcome && !showProductModal && !showChildModal && !showEventLogs} 
      />
      <Modal isVisible={showProductModal}>
        <ProductSelector 
          products={demoLinkCompleted 
            ? PRODUCTS_ARRAY.filter(p => demoProductsVisibility[p.id])
            : PRODUCTS_ARRAY} 
          onSelect={handleProductSelect}
          onSettingsClick={demoLinkCompleted ? undefined : handleOpenSettings}
          hasCustomSettings={hasCustomSettings}
          onResetClick={demoLinkCompleted ? handleStartOver : undefined}
        />
      </Modal>
      <Modal isVisible={showChildModal}>
        {selectedProduct && PRODUCT_CONFIGS[selectedProduct]?.children && (
          <ProductSelector 
            products={demoLinkCompleted 
              ? PRODUCT_CONFIGS[selectedProduct].children!.filter(c => demoProductsVisibility[c.id])
              : PRODUCT_CONFIGS[selectedProduct].children!} 
            onSelect={handleChildProductSelect}
            onBack={() => {
              setShowChildModal(false);
              setShowProductModal(true);
            }}
            showBackButton={true}
            onSettingsClick={demoLinkCompleted ? undefined : handleOpenSettings}
            hasCustomSettings={hasCustomSettings}
            title={PRODUCT_CONFIGS[selectedProduct].name}
            onResetClick={demoLinkCompleted ? handleStartOver : undefined}
          />
        )}
      </Modal>
      <Modal isVisible={showSettingsModal}>
        <div className="settings-modal">
          <div className="settings-header">
            <h2>Advanced Settings</h2>
          </div>
          <div className="settings-grid">
            <SettingsToggle 
              label="⚡️ Mode" 
              checked={tempZapMode} 
              onChange={handleToggleZap} 
              disabled={tempDemoMode} 
            />
            <SettingsToggle 
              label="Demo Mode" 
              checked={tempDemoMode} 
              onChange={handleToggleDemo} 
              disabled={tempZapMode} 
            />
            <SettingsToggle 
              label="Embedded Mode" 
              checked={tempEmbeddedMode} 
              onChange={handleToggleEmbedded} 
              disabled={true} 
            />
            <SettingsToggle 
              label="Layer" 
              checked={tempLayerMode} 
              onChange={handleToggleLayer} 
              disabled={true}
            />
          </div>
          <div className="button-row">
            <button className="action-button button-red" onClick={handleCancelSettings}>
              Cancel
            </button>
            <button className="action-button button-blue" onClick={handleSaveSettings}>
              Save
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Demo Mode Product Selection Modal */}
      <Modal isVisible={showDemoProductsModal}>
        <div className="demo-products-modal">
          <div className="settings-header">
            <h2>Select Products to Demo</h2>
          </div>
          <div className="demo-products-grid">
            {PRODUCTS_ARRAY.map(product => (
              <div key={product.id} className="product-group-container">
                <div className="product-group">
                  <SettingsToggle
                    label={product.name}
                    checked={demoProductsVisibility[product.id] || false}
                    onChange={() => handleToggleDemoProduct(product.id)}
                    disabled={false}
                  />
                  {product.children && (
                    <div className="product-children-nested">
                      {product.children.map(child => (
                        <SettingsToggle
                          key={child.id}
                          label={child.shortName || child.name}
                          checked={demoProductsVisibility[child.id] || false}
                          onChange={() => handleToggleDemoProduct(child.id)}
                          disabled={false}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="button-row">
            <button className="action-button button-red" onClick={handleCancelDemoProducts}>
              Cancel
            </button>
            <button
              className="action-button button-blue"
              onClick={handleDemoProductsGo}
              disabled={!Object.values(demoProductsVisibility).some(v => v)}
            >
              Go
            </button>
          </div>
        </div>
      </Modal>
      
      <Modal isVisible={showModal && !(showEventLogs && (modalState === 'callback-success' || modalState === 'callback-exit'))}>
        {renderModalContent()}
      </Modal>
      
      {/* Event Logs Modal - Shows side by side with Plaid Link */}
      <div className={`event-logs-container ${showEventLogs ? 'visible' : ''} event-logs-${eventLogsPosition} ${isTransitioningModals ? 'fading-out' : ''}`}>
        <div className="event-logs-modal">
          <div className="modal-success">
            <div className="success-header">
              <h2>🟢 onEvent Callbacks</h2>
            </div>
          <p className="callback-description">
            Here&apos;s what went down:
          </p>
            <div className="event-logs-wrapper">
              <button 
                className={`event-logs-copy-button ${eventLogsCopied ? 'copied' : ''}`}
                onClick={async () => {
                  if (linkEvents.length > 0) {
                    try {
                      await navigator.clipboard.writeText(JSON.stringify(linkEvents, null, 2));
                      setEventLogsCopied(true);
                      setTimeout(() => setEventLogsCopied(false), 2000);
                    } catch (err) {
                      console.error('Failed to copy:', err);
                    }
                  }
                }}
                disabled={linkEvents.length === 0}
                aria-label="Copy all event callbacks"
              >
                {eventLogsCopied ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
              <div className="event-logs-scroll" ref={eventLogsRef}>
                {linkEvents.length > 0 ? (
                  linkEvents.map((event, index) => (
                    <div key={index} className={`event-log-item ${index % 2 === 0 ? 'even' : 'odd'}`}>
                      <JsonHighlight data={event} showCopyButton={false} />
                    </div>
                  ))
                ) : (
                  <div className="event-log-placeholder">
                    <pre className="code-block">
                      <code>... waiting for events</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Callback Modal Container - Shows on the right when event logs slide left */}
      {(modalState === 'callback-success' || modalState === 'callback-exit') && showEventLogs && (
        <div className={`callback-modal-container ${isTransitioningModals ? 'fading-out' : ''}`}>
          {renderModalContent()}
        </div>
      )}

      {/* Zap Mode Results - Side by side display of accounts and product data */}
      {modalState === 'zap-mode-results' && productData && (
        <>
          {accountsData && (
            <div className="zap-results-left">
              <div className="modal-success">
                <div className="success-header">
                <div className="success-icon">✓</div>
                  <h2>/accounts/get Response</h2>
                  <button className="reset-icon-button" onClick={handleZapReset} title="Reset Session" style={{ background: 'linear-gradient(135deg, #c7659f 0%, #c43d52 100%)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                    </svg>
                  </button>
                </div>
                <div className="account-data">
                  <JsonHighlight 
                    data={accountsData}
                    expandableCopy={{
                      responseData: accountsData,
                      accessToken: accessToken
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className={accountsData ? "zap-results-right" : "zap-results-center"}>
            <div className="modal-success">
              <div className="success-header">
                <div className="success-icon">✓</div>
                <h2>
                  {(() => {
                        const effectiveProductId = selectedChildProduct || selectedProduct;
                        const productConfig = getProductConfigById(effectiveProductId!);
                        return productConfig?.apiTitle || productConfig?.name || 'Product API';
                      })()} Response
                </h2>
                <button className="reset-icon-button" onClick={handleZapReset} title="Reset Session" style={{ background: 'linear-gradient(135deg, #c7659f 0%, #c43d52 100%)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                  </svg>
                </button>
              </div>
              <div className="account-data">
                <JsonHighlight 
                  data={productData} 
                  highlightKeys={(() => {
                    const effectiveProductId = selectedChildProduct || selectedProduct;
                    const productConfig = getProductConfigById(effectiveProductId!);
                    return productConfig?.highlightKeys;
                  })()}
                  expandableCopy={{
                    responseData: productData,
                    accessToken: accessToken
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Zap Mode Reset Button */}
      {showZapResetButton && (
        <button className="zap-reset-button" onClick={handleZapReset}>
          Woah. Do That Again.
        </button>
      )}
    </div>
  );
}

