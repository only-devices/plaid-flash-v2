'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import Image from 'next/image';
import LinkButton from '@/components/LinkButton';
import Modal from '@/components/Modal';
import ProductSelector from '@/components/ProductSelector';
import JsonHighlight from '@/components/JsonHighlight';
import CodeEditor from '@uiw/react-textarea-code-editor';
import SettingsToggle from '@/components/SettingsToggle';
import ArrowButton from '@/components/ArrowButton';
import WebhookPanel from '@/components/WebhookPanel';
import MultiItemWebhookPanel from '@/components/MultiItemWebhookPanel';
import CashflowUpdatesWebhookPanel, { type CashflowUpdatesWebhookEvent } from '@/components/CashflowUpdatesWebhookPanel';
import IncomeInsightsVisualization from '@/components/IncomeInsightsVisualization';
import PdfResponseViewer from '@/components/PdfResponseViewer';
import { PRODUCTS_ARRAY, PRODUCT_CONFIGS, getProductConfigById, ProductConfig } from '@/lib/productConfig';
import { isWebhooksEnabledClient } from '@/lib/featureFlags';
import { generateClientUserId } from '@/lib/generateClientUserId';

// Feature flag for webhooks (development-only)
const WEBHOOKS_ENABLED = isWebhooksEnabledClient();
const IS_DEV = process.env.NODE_ENV === 'development';
const WEBHOOK_URL_OVERRIDE_STORAGE_KEY = 'plaid_flash_webhook_url';
const DEFAULT_LAYER_TEMPLATE_ID = 'template_5xk9wmaarmlp';
const DEFAULT_LAYER_PHONE_NUMBER = '+14155550011';
const DEFAULT_LAYER_DATE_OF_BIRTH = '1975-01-18';

type MultiItemAccessTokenInfo = {
  access_token: string;
  item_id?: string | null;
  institution_id?: string | null;
  institution_name?: string | null;
};

type HybridStep =
  | {
      kind: 'accounts';
      title: string;
    }
  | {
      kind: 'product';
      title: string;
      productId: string;
      apiEndpoint: string;
      isCRA: boolean;
    };

export default function Home() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [showGrandchildModal, setShowGrandchildModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedChildProduct, setSelectedChildProduct] = useState<string | null>(null);
  const [selectedGrandchildProduct, setSelectedGrandchildProduct] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const [multiItemAccessTokens, setMultiItemAccessTokens] = useState<MultiItemAccessTokenInfo[]>([]);
  const [activeMultiItemAccessTokenIndex, setActiveMultiItemAccessTokenIndex] = useState<number>(0);
  const [modalState, setModalState] = useState<
    | 'loading'
    | 'layer-creating-session'
    | 'layer-phone-submit'
    | 'layer-waiting-eligibility'
    | 'layer-dob-submit'
    | 'layer-processing-session-get'
    | 'layer-processing-user-update'
    | 'layer-processing-check-report-create'
    | 'layer-processing-identity-match'
    | 'layer-identity-match-results'
    | 'preview-user-create'
    | 'preview-user-update'
    | 'preview-config'
    | 'preview-sandbox-config'
    | 'preview-product-api'
    | 'callback-success'
    | 'callback-exit'
    | 'callback-exit-zap'
    | 'accounts-data'
    | 'processing-accounts'
    | 'processing-product'
    | 'processing-user-create'
    | 'creating-sandbox-item'
    | 'hosted-waiting'
    | 'update-mode-input'
    | 'upgrade-mode-pick-product'
    | 'hybrid-step'
    | 'cashflow-updates-loading-items'
    | 'cashflow-updates-pick-item'
    | 'cashflow-updates-subscribing'
    | 'cashflow-updates-webhooks'
    | 'cashflow-updates-fetching-report'
    | 'success'
    | 'error'
    | 'api-error'
    | 'zap-mode-results'
    | 'tidying-up'
  >('loading');
  const [accountsData, setAccountsData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [callbackData, setCallbackData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorData, setErrorData] = useState<any>(null);
  const [apiStatusCode, setApiStatusCode] = useState<number>(200);
  const [linkEvents, setLinkEvents] = useState<any[]>([]);
  const [showEventLogs, setShowEventLogs] = useState(false);
  const [eventLogsCopied, setEventLogsCopied] = useState(false);
  const [eventLogsExpanded, setEventLogsExpanded] = useState(false);
  const [eventLogsSliding, setEventLogsSliding] = useState(false);
  const eventLogsRef = useRef<HTMLDivElement>(null);
  const [linkTokenConfig, setLinkTokenConfig] = useState<any>(null);
  const [eventLogsPosition, setEventLogsPosition] = useState<'left' | 'right'>('right');
  const [isTransitioningModals, setIsTransitioningModals] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editedConfig, setEditedConfig] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);
  
  // Settings/Configuration state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'flash' | 'link' | 'advanced'>('flash');
  const [zapMode, setZapMode] = useState(false);
  const [embeddedMode, setEmbeddedMode] = useState(false);
  const [layerMode, setLayerMode] = useState(false);
  const [layerIdentityMatchEnabled, setLayerIdentityMatchEnabled] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [multiItemLinkEnabled, setMultiItemLinkEnabled] = useState(false);
  const [hostedLinkEnabled, setHostedLinkEnabled] = useState(false);
  const [autoRemoveEnabled, setAutoRemoveEnabled] = useState(true);
  const [tempZapMode, setTempZapMode] = useState(false);
  const [tempEmbeddedMode, setTempEmbeddedMode] = useState(false);
  const [tempLayerMode, setTempLayerMode] = useState(false);
  const [tempLayerIdentityMatchEnabled, setTempLayerIdentityMatchEnabled] = useState(false);
  const [tempDemoMode, setTempDemoMode] = useState(false);
  const [tempMultiItemLinkEnabled, setTempMultiItemLinkEnabled] = useState(false);
  const [tempHostedLinkEnabled, setTempHostedLinkEnabled] = useState(false);
  const [tempAutoRemoveEnabled, setTempAutoRemoveEnabled] = useState(true);
  const [useLegacyUserToken, setUseLegacyUserToken] = useState(false);
  const [tempUseLegacyUserToken, setTempUseLegacyUserToken] = useState(false);
  const [useAltCredentials, setUseAltCredentials] = useState(false);
  const [tempUseAltCredentials, setTempUseAltCredentials] = useState(false);
  const [altCredentialsAvailable, setAltCredentialsAvailable] = useState(false);
  const [includePhoneNumber, setIncludePhoneNumber] = useState(true);
  const [tempIncludePhoneNumber, setTempIncludePhoneNumber] = useState(true);
  const [bypassLink, setBypassLink] = useState(false);
  const [tempBypassLink, setTempBypassLink] = useState(false);
  const [showZapResetButton, setShowZapResetButton] = useState(false);
  
  // Demo Mode state
  const [demoLinkCompleted, setDemoLinkCompleted] = useState(false);
  const [demoAccessToken, setDemoAccessToken] = useState<string | null>(null);
  const [showDemoProductsModal, setShowDemoProductsModal] = useState(false);
  const [demoProductsVisibility, setDemoProductsVisibility] = useState<Record<string, boolean>>({});
  const [isDemoModeStarting, setIsDemoModeStarting] = useState(false);
  const [demoPendingLinkTokenConfig, setDemoPendingLinkTokenConfig] = useState<any>(null);

  // CRA Mode state
  const [userCreateConfig, setUserCreateConfig] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [usedUserToken, setUsedUserToken] = useState<boolean>(false); // Track which param was used for Link Token
  const [isEditingUserCreateConfig, setIsEditingUserCreateConfig] = useState(false);
  const [editedUserCreateConfig, setEditedUserCreateConfig] = useState('');
  const [userCreateConfigError, setUserCreateConfigError] = useState<string | null>(null);

  // Layer + CRA: /user/update preview state (identity persistence before report creation)
  const [userUpdateConfig, setUserUpdateConfig] = useState<any>(null);
  const [isEditingUserUpdateConfig, setIsEditingUserUpdateConfig] = useState(false);
  const [editedUserUpdateConfig, setEditedUserUpdateConfig] = useState('');
  const [userUpdateConfigError, setUserUpdateConfigError] = useState<string | null>(null);
  const [craLayerPendingAfterUserUpdate, setCraLayerPendingAfterUserUpdate] = useState<null | {
    userId: string;
    webhook: string;
    productsToCreate: string[];
  }>(null);

  // Product API Preview state
  const [productApiConfig, setProductApiConfig] = useState<any>(null);
  // In some flows (e.g. Upgrade Mode), the selected product is not the API target.
  // This override tells the Product API preview/execution which leaf config to use.
  const [productApiTargetProductId, setProductApiTargetProductId] = useState<string | null>(null);
  const [isEditingProductApiConfig, setIsEditingProductApiConfig] = useState(false);
  const [editedProductApiConfig, setEditedProductApiConfig] = useState('');
  const [productApiConfigError, setProductApiConfigError] = useState<string | null>(null);

  // Sandbox Config state (for bypass Link mode)
  const [sandboxConfig, setSandboxConfig] = useState<any>(null);
  const [isEditingSandboxConfig, setIsEditingSandboxConfig] = useState(false);
  const [editedSandboxConfig, setEditedSandboxConfig] = useState('');
  const [sandboxConfigError, setSandboxConfigError] = useState<string | null>(null);

  // Webhook state
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showWebhookPanel, setShowWebhookPanel] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [webhookUrlOverride, setWebhookUrlOverride] = useState<string>('');
  const [tempWebhookUrlOverride, setTempWebhookUrlOverride] = useState<string>('');
  const webhookUrlRef = useRef<string | null>(null);

  useEffect(() => {
    webhookUrlRef.current = webhookUrl;
  }, [webhookUrl]);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Hybrid CRA + non-CRA flow state (CRA product selected but Link config includes non-CRA products)
  const [hybridModeActive, setHybridModeActive] = useState(false);
  const [hybridNonCraProducts, setHybridNonCraProducts] = useState<string[]>([]);
  const [hybridCraProducts, setHybridCraProducts] = useState<string[]>([]);
  const [hybridQueue, setHybridQueue] = useState<HybridStep[]>([]);
  const [hybridStepIndex, setHybridStepIndex] = useState<number>(0);
  const [hybridStepData, setHybridStepData] = useState<any>(null);
  const [hybridStepStatusCode, setHybridStepStatusCode] = useState<number>(200);
  const [hybridStepTitle, setHybridStepTitle] = useState<string>('');

  // View mode state for CRA Income Insights
  const [viewMode, setViewMode] = useState<'json' | 'visual'>('json');

  // Embedded Link state
  const [embeddedLinkActive, setEmbeddedLinkActive] = useState(false);
  const [embeddedInstitutionSelected, setEmbeddedInstitutionSelected] = useState(false);
  const [embeddedLinkReady, setEmbeddedLinkReady] = useState(false);
  const embeddedContainerRef = useRef<HTMLDivElement>(null);
  const embeddedLinkHandlerRef = useRef<any>(null);

  // Hosted Link state
  const [hostedLinkActive, setHostedLinkActive] = useState(false);
  const [hostedLinkUrl, setHostedLinkUrl] = useState<string | null>(null);
  const [hostedLinkManualPayload, setHostedLinkManualPayload] = useState<string>('');
  const [hostedLinkManualParseError, setHostedLinkManualParseError] = useState<string | null>(null);
  const [hostedLinkExtractedPublicTokens, setHostedLinkExtractedPublicTokens] = useState<string[]>([]);
  const hostedLinkPopupRef = useRef<Window | null>(null);
  const [hostedWaitingMode, setHostedWaitingMode] = useState<'hosted_link' | 'cra_check_report'>('hosted_link');
  const [craCheckReportExpectedUserId, setCraCheckReportExpectedUserId] = useState<string | null>(null);
  const [craCheckReportManualReady, setCraCheckReportManualReady] = useState(false);

  // Layer state
  const [layerSessionActive, setLayerSessionActive] = useState(false);
  const [layerPendingUserCreate, setLayerPendingUserCreate] = useState(false);
  const [layerPendingProductId, setLayerPendingProductId] = useState<string | null>(null);
  const [layerPhoneSubmitConfig, setLayerPhoneSubmitConfig] = useState<any>({ phone_number: DEFAULT_LAYER_PHONE_NUMBER });
  const [isEditingLayerPhoneSubmitConfig, setIsEditingLayerPhoneSubmitConfig] = useState(false);
  const [editedLayerPhoneSubmitConfig, setEditedLayerPhoneSubmitConfig] = useState(
    JSON.stringify({ phone_number: DEFAULT_LAYER_PHONE_NUMBER }, null, 2)
  );
  const [layerPhoneSubmitConfigError, setLayerPhoneSubmitConfigError] = useState<string | null>(null);
  const [layerDateOfBirth, setLayerDateOfBirth] = useState<string>(DEFAULT_LAYER_DATE_OF_BIRTH);
  const [layerDobSubmitConfig, setLayerDobSubmitConfig] = useState<any>({ date_of_birth: DEFAULT_LAYER_DATE_OF_BIRTH });
  const [isEditingLayerDobSubmitConfig, setIsEditingLayerDobSubmitConfig] = useState(false);
  const [editedLayerDobSubmitConfig, setEditedLayerDobSubmitConfig] = useState(
    JSON.stringify({ date_of_birth: DEFAULT_LAYER_DATE_OF_BIRTH }, null, 2)
  );
  const [layerDobSubmitConfigError, setLayerDobSubmitConfigError] = useState<string | null>(null);
  const [layerIdentityMatchData, setLayerIdentityMatchData] = useState<any>(null);

  // Update Mode (Link-only) state
  const [updateModeAccessTokenInput, setUpdateModeAccessTokenInput] = useState<string>('');

  // Upgrade Mode (Link-only, CRA-like) state
  const [upgradeModeProductCandidates, setUpgradeModeProductCandidates] = useState<ProductConfig[]>([]);
  const [upgradeModeSelectedProductIndex, setUpgradeModeSelectedProductIndex] = useState<number>(0);

  // CRA Monitoring Insights (Cashflow Updates) state
  type CashflowUpdatesItem = { institution_name: string; item_id: string };
  const [cashflowUpdatesItems, setCashflowUpdatesItems] = useState<CashflowUpdatesItem[]>([]);
  const [cashflowUpdatesSelectedIndex, setCashflowUpdatesSelectedIndex] = useState<number>(0);
  const [cashflowUpdatesSubscribedItemId, setCashflowUpdatesSubscribedItemId] = useState<string | null>(null);
  const [cashflowUpdatesSubscriptionResponse, setCashflowUpdatesSubscriptionResponse] = useState<any>(null);
  const [cashflowUpdatesManualPayload, setCashflowUpdatesManualPayload] = useState<string>('');
  const [cashflowUpdatesManualParseError, setCashflowUpdatesManualParseError] = useState<string | null>(null);
  const [cashflowUpdatesManualWebhooks, setCashflowUpdatesManualWebhooks] = useState<CashflowUpdatesWebhookEvent[]>([]);

  const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
  const effectiveProductConfig = effectiveProductId ? getProductConfigById(effectiveProductId) : undefined;
  const isMultiItemFlowActive = multiItemLinkEnabled && !effectiveProductConfig?.isCRA;
  const effectiveWebhookConfigUrl = IS_DEV ? webhookUrl : (webhookUrlOverride.trim() || null);
  const effectiveWebhookConfigUrlForSettings = IS_DEV ? webhookUrl : (tempWebhookUrlOverride.trim() || null);

  // Some callbacks (e.g. Link's onSuccess/onExit) may be registered once; keep selected product in a ref.
  const effectiveProductIdRef = useRef<string | null>(null);
  useEffect(() => {
    effectiveProductIdRef.current = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
  }, [selectedProduct, selectedChildProduct, selectedGrandchildProduct]);
  const hasCustomSettings =
    zapMode ||
    embeddedMode ||
    layerMode ||
    layerIdentityMatchEnabled ||
    demoMode ||
    multiItemLinkEnabled ||
    hostedLinkEnabled ||
    !autoRemoveEnabled ||
    useLegacyUserToken ||
    useAltCredentials ||
    !includePhoneNumber ||
    bypassLink ||
    (!IS_DEV && webhookUrlOverride.trim().length > 0);

  const leafProductConfigs = useMemo(() => {
    const leafs: ProductConfig[] = [];
    const visit = (cfg: ProductConfig) => {
      if (cfg.apiEndpoint) {
        leafs.push(cfg);
      }
      if (cfg.children) {
        cfg.children.forEach(visit);
      }
    };
    PRODUCTS_ARRAY.forEach(visit);
    return leafs;
  }, []);

  const getProductDisableInfo = useCallback(
    (productId: string) => {
      const cfg = getProductConfigById(productId);
      const isLeaf = !!cfg?.apiEndpoint;

      if (layerMode && useLegacyUserToken && isLeaf && cfg?.isCRA) {
        return {
          disabled: true,
          reason: 'Layer + CRA requires user_id. Disable legacy user_token to continue.',
        };
      }

      if (
        layerMode &&
        (productId === 'signal' ||
          productId === 'signal-evaluate' ||
          productId === 'signal-balance' ||
          productId === 'investments-move' ||
          productId === 'link-update-mode' ||
          productId === 'link-upgrade-mode')
      ) {
        return {
          disabled: true,
          reason: 'Disable Layer in settings to use this product.',
        };
      }

      if (productId === 'link-upgrade-mode' && !effectiveWebhookConfigUrl) {
        return {
          disabled: true,
          reason: 'Configure a webhook URL in settings first.',
        };
      }

      if (isLeaf && cfg?.requiresWebhook && !effectiveWebhookConfigUrl) {
        return {
          disabled: true,
          reason: 'Configure a webhook URL in settings first.',
        };
      }
      return { disabled: false as const };
    },
    [effectiveWebhookConfigUrl, layerMode, useLegacyUserToken]
  );

  // Helper function to build API request body with product-specific params
  const buildProductRequestBody = (
    baseParams: Record<string, any>,
    productConfig: ProductConfig | undefined,
    accountsDataParam?: any
  ): Record<string, any> => {
    const requestBody = { ...baseParams };
    
    // Automatically merge additional API params if they exist
    if (productConfig?.additionalApiParams) {
      Object.assign(requestBody, productConfig.additionalApiParams);
    }
    
    // For Signal Evaluate, add dynamic fields
    if (productConfig?.id === 'signal-evaluate') {
      const accounts = accountsDataParam?.accounts || accountsData?.accounts;
      if (accounts && accounts.length > 0) {
        requestBody.account_id = accounts[0].account_id;
      }
      // Add client_transaction_id with timestamp
      if (!requestBody.client_transaction_id) {
        requestBody.client_transaction_id = 'txn_flash_' + Date.now();
      }
      // Add ruleset_key
      if (!requestBody.ruleset_key) {
        requestBody.ruleset_key = 'default';
      }
    }
    
    // For Signal Balance, add account_id from the first account
    if (productConfig?.id === 'signal-balance') {
      const accounts = accountsDataParam?.accounts || accountsData?.accounts;
      if (accounts && accounts.length > 0) {
        requestBody.account_id = accounts[0].account_id;
      }
    }
    
    return requestBody;
  };

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

  // Production (Vercel): load saved webhook URL override from localStorage
  useEffect(() => {
    if (IS_DEV) return;
    try {
      const saved = localStorage.getItem(WEBHOOK_URL_OVERRIDE_STORAGE_KEY);
      if (saved) {
        setWebhookUrlOverride(saved);
      }
    } catch (e) {
      // Ignore storage errors (privacy mode, etc.)
    }
  }, []);

  // SSE connection for real-time webhook updates
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const initWebhooks = async () => {
      // Load credential mode (cookie-backed) + availability
      try {
        const response = await fetch('/api/credentials-mode');
        const data = await response.json();
        setAltCredentialsAvailable(!!data.altAvailable);
        setUseAltCredentials(!!data.useAltCredentials);
      } catch (error) {
        console.error('Error loading credential mode:', error);
      }

      // Only initialize webhook URL + SSE stream when feature is enabled (dev)
      if (!WEBHOOKS_ENABLED) {
        return;
      }

      // Fetch webhook URL on mount
      try {
        const response = await fetch('/api/webhook-url');
        const data = await response.json();
        if (data.webhookUrl) {
          setWebhookUrl(data.webhookUrl);
          console.log('Webhook URL:', data.webhookUrl);
        } else if (data.message) {
          console.log('Webhook status:', data.message);
        }
      } catch (error) {
        console.error('Error fetching webhook URL:', error);
      }

      // Connect to SSE stream for webhook updates
      try {
        eventSource = new EventSource('/api/webhooks-stream');
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'connected') {
              // Initial connection - load existing webhooks
              if (data.webhooks && data.webhooks.length > 0) {
                setWebhooks(data.webhooks);
              }
            } else if (data.type === 'heartbeat') {
              // Heartbeat - ignore
            } else {
              // New webhook received
              setWebhooks(prev => [data, ...prev]);
            }
          } catch (error) {
            console.error('Error parsing SSE data:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          // EventSource will automatically try to reconnect
        };
      } catch (error) {
        console.error('Error connecting to SSE:', error);
      }
    };

    initWebhooks();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Layer + CRA: if the check report fails while we're waiting, surface the failure immediately.
  useEffect(() => {
    if (hostedWaitingMode !== 'cra_check_report') return;
    if (!craCheckReportExpectedUserId) return;
    if (!Array.isArray(webhooks) || webhooks.length === 0) return;

    const failed = webhooks.find((w: any) => {
      const t = w?.webhook_type ?? w?.payload?.webhook_type;
      const c = w?.webhook_code ?? w?.payload?.webhook_code;
      if (t !== 'CHECK_REPORT') return false;
      if (c !== 'USER_CHECK_REPORT_FAILED') return false;
      const u = w?.payload?.user_id ?? w?.user_id;
      return !u || u === craCheckReportExpectedUserId;
    });

    if (!failed) return;

    setErrorData(failed?.payload ?? failed);
    setApiStatusCode(200);
    setHostedWaitingMode('hosted_link');
    setCraCheckReportExpectedUserId(null);
    setCraCheckReportManualReady(false);
    setModalState('api-error');
    setShowModal(true);
  }, [hostedWaitingMode, craCheckReportExpectedUserId, webhooks]);

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
        if (hostedLinkEnabled) {
          try {
            hostedLinkPopupRef.current?.close();
          } catch {
            // ignore
          }
          hostedLinkPopupRef.current = null;
        }
        setErrorData(data);
        setApiStatusCode(response.status);
        setModalState('api-error');
        setShowModal(true);
        setShowWelcome(false);
        return;
      }
      
      setLinkToken(data.link_token);

      if (hostedLinkEnabled) {
        if (data.hosted_link_url) {
          setHostedLinkActive(true);
          setHostedLinkUrl(data.hosted_link_url);
          setHostedLinkManualPayload('');
          setHostedLinkManualParseError(null);
          setHostedLinkExtractedPublicTokens([]);
          setHostedWaitingMode('hosted_link');
          setCraCheckReportExpectedUserId(null);
          setCraCheckReportManualReady(false);
          setShowEventLogs(false);
          setShowWebhookPanel(false);
          setModalState('hosted-waiting');
          setShowModal(true);
          window.open(data.hosted_link_url, '_blank', 'noopener,noreferrer');
        } else {
          // Avoid a blank screen if Plaid doesn't return hosted_link_url
          if (hostedLinkEnabled) {
            try {
              hostedLinkPopupRef.current?.close();
            } catch {
              // ignore
            }
            hostedLinkPopupRef.current = null;
          }
          setHostedLinkActive(false);
          setHostedLinkUrl(null);
          setErrorData({
            error_code: 'HOSTED_LINK_URL_MISSING',
            error_message:
              'Hosted Link is enabled, but Plaid did not return hosted_link_url from /link/token/create. Ensure the request includes hosted_link: {}.',
            link_token: data.link_token,
          });
          setApiStatusCode(500);
          setModalState('api-error');
          setShowModal(true);
          setShowWelcome(false);
        }
      }
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
      setSelectedGrandchildProduct(null);
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
    // Get the child config to check if it has grandchildren
    const parentConfig = PRODUCT_CONFIGS[selectedProduct!];
    const childConfig = parentConfig?.children?.find(c => c.id === childId);
    
    // If child has grandchildren (3rd level), show grandchild modal
    if (childConfig?.children && childConfig.children.length > 0) {
      setSelectedChildProduct(childId);
      setShowChildModal(false);
      setShowGrandchildModal(true);
    } else {
      // No grandchildren - this is a leaf product
      setSelectedChildProduct(childId);
      setSelectedGrandchildProduct(null);
      setShowChildModal(false);
      
      // If in Demo Mode with Link completed, call API directly
      if (demoLinkCompleted) {
        handleDemoModeApiCall(childId);
      } else {
        // Normal mode: show preview modal
        showLinkConfigPreview(childId);
      }
    }
  };

  const handleGrandchildProductSelect = (grandchildId: string) => {
    setSelectedGrandchildProduct(grandchildId);
    setShowGrandchildModal(false);
    
    // If in Demo Mode with Link completed, call API directly
    if (demoLinkCompleted) {
      handleDemoModeApiCall(grandchildId);
    } else {
      // Normal mode: show preview modal
      showLinkConfigPreview(grandchildId);
    }
  };

  const createLayerSessionToken = useCallback(
    async (targetProductId: string, userForSession: { client_user_id: string; user_id: string }) => {
      const cfg = getProductConfigById(targetProductId);
      if (!cfg) return;

      try {
        setLayerSessionActive(true);
        setLayerPhoneSubmitConfig({ phone_number: DEFAULT_LAYER_PHONE_NUMBER });
        setIsEditingLayerPhoneSubmitConfig(false);
        setEditedLayerPhoneSubmitConfig(JSON.stringify({ phone_number: DEFAULT_LAYER_PHONE_NUMBER }, null, 2));
        setLayerPhoneSubmitConfigError(null);
        setLayerDateOfBirth(DEFAULT_LAYER_DATE_OF_BIRTH);
        setLayerDobSubmitConfig({ date_of_birth: DEFAULT_LAYER_DATE_OF_BIRTH });
        setIsEditingLayerDobSubmitConfig(false);
        setEditedLayerDobSubmitConfig(JSON.stringify({ date_of_birth: DEFAULT_LAYER_DATE_OF_BIRTH }, null, 2));
        setLayerDobSubmitConfigError(null);
        setWebhooks([]);
        setLinkEvents([]);

        // Don't show event/webhook side panels until Link is actually opened (LAYER_READY).
        setShowEventLogs(false);
        setEventLogsPosition('right');
        setShowWebhookPanel(false);

        setShowModal(true);
        setShowWelcome(false);

        const template_id = cfg.layerTemplateId || DEFAULT_LAYER_TEMPLATE_ID;
        const client_user_id = String(userForSession?.client_user_id || '').trim();
        const user_id = String(userForSession?.user_id || '').trim();
        if (!client_user_id) {
          throw new Error('Missing user.client_user_id for Layer session/token/create');
        }
        if (!user_id) {
          throw new Error('Missing user_id for Layer session/token/create');
        }

        const resp = await fetch('/api/session-token-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_id,
            webhook: effectiveWebhookConfigUrl,
            user: { client_user_id },
            user_id,
          }),
        });

        const json = await resp.json();
        if (resp.status >= 400) {
          setErrorData(json);
          setApiStatusCode(resp.status);
          setModalState('api-error');
          setShowModal(true);
          setShowWelcome(false);
          return;
        }

        if (!json?.link_token || typeof json.link_token !== 'string') {
          setErrorData({
            error: 'LAYER_SESSION_TOKEN_CREATE_FAILED',
            message: 'Backend did not return a valid link_token for Layer.',
            raw: json,
          });
          setApiStatusCode(502);
          setModalState('api-error');
          setShowModal(true);
          setShowWelcome(false);
          return;
        }

        setLinkToken(json.link_token);
        setModalState('layer-phone-submit');
        setShowModal(true);
        setShowWelcome(false);
      } catch (e: any) {
        setErrorData({
          error: 'LAYER_SESSION_TOKEN_CREATE_FAILED',
          message: e?.message || 'Failed to create Layer session token',
        });
        setApiStatusCode(500);
        setModalState('api-error');
        setShowModal(true);
        setShowWelcome(false);
      }
    },
    [effectiveWebhookConfigUrl, useAltCredentials, webhookUrl]
  );

  const runNonCraFlowWithAccessToken = useCallback(
    async (access_token: string) => {
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      if (!effectiveProductId) return;

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

      const skipAccountsGet = effectiveProductId === 'signal-balance';

      if (skipAccountsGet) {
        setModalState('processing-product');
        setShowModal(true);

        const productConfig = getProductConfigById(effectiveProductId);
        if (!productConfig || !productConfig.apiEndpoint) {
          throw new Error('Product API endpoint not configured');
        }

        const requestBody = buildProductRequestBody(
          { access_token },
          productConfig
        );

        const productResponse = await fetch(productConfig.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const productJson = await productResponse.json();
        if (productResponse.status >= 400) {
          setErrorData(productJson);
          setApiStatusCode(productResponse.status);
          setModalState('api-error');
          setShowModal(true);
          return;
        }

        setProductData(productJson);
        setApiStatusCode(productResponse.status);
        setModalState('success');
        setShowModal(true);
        return;
      }

      // Get accounts data
      setModalState('processing-accounts');
      setShowModal(true);

      const accountsResponse = await fetch('/api/accounts-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token }),
      });

      const accountsJson = await accountsResponse.json();
      if (accountsResponse.status >= 400) {
        setErrorData(accountsJson);
        setApiStatusCode(accountsResponse.status);
        setModalState('api-error');
        setShowModal(true);
        return;
      }

      setAccountsData(accountsJson);
      setApiStatusCode(accountsResponse.status);
      setModalState('accounts-data');
      setShowModal(true);
    },
    [demoMode, selectedGrandchildProduct, selectedChildProduct, selectedProduct]
  );

  const showLinkConfigPreview = (productId: string) => {
    const productConfig = getProductConfigById(productId);
    if (!productConfig) {
      return;
    }

    // Link-only: Update Mode starts with an access_token input step
    if (productId === 'link-update-mode') {
      setUpdateModeAccessTokenInput('');
      setModalState('update-mode-input');
      setShowModal(true);
      setShowWelcome(false);
      return;
    }

    // Link-only: Upgrade Mode starts with /user/create (same as Multi-item Link Step 1)
    if (productId === 'link-upgrade-mode') {
      setUpgradeModeProductCandidates([]);
      setUpgradeModeSelectedProductIndex(0);
      setConfigError(null);
      setIsEditingConfig(false);

      if (!effectiveWebhookConfigUrl) {
        setErrorData({
          error: 'WEBHOOK_URL_REQUIRED',
          message: 'Configure a webhook URL in Settings before using Upgrade Mode.',
        });
        setApiStatusCode(400);
        setModalState('api-error');
        setShowModal(true);
        setShowWelcome(false);
        return;
      }

      showUserCreatePreview(productId);
      return;
    }

    // Layer flow: use /session/token/create + submit-driven eligibility
    if (layerMode) {
      if (!effectiveWebhookConfigUrl) {
        setErrorData({
          error: 'WEBHOOK_URL_REQUIRED',
          message: 'Configure a webhook URL in Settings before using Layer.',
        });
        setApiStatusCode(400);
        setModalState('api-error');
        setShowModal(true);
        setShowWelcome(false);
        return;
      }

      if (useLegacyUserToken) {
        setErrorData({
          error: 'LAYER_LEGACY_UNSUPPORTED',
          message: 'Layer requires user_id. Disable legacy user_token to continue.',
          productId,
        });
        setApiStatusCode(400);
        setModalState('api-error');
        setShowModal(true);
        setShowWelcome(false);
        return;
      }

      // Layer always requires a /user/create step so we have a user_id
      // to pass into /session/token/create as user.user_id.
      setLayerPendingUserCreate(true);
      setLayerPendingProductId(productId);
      showUserCreatePreview(productId);
      return;
    }

    // For CRA products (and Multi-item Link), show user create modal first
    if (productConfig.isCRA || multiItemLinkEnabled) {
      showUserCreatePreview(productId);
      return;
    }

    // Bypass Link mode: build sandbox config instead of link token config
    if (bypassLink) {
      const sandboxFullConfig: any = {
        institution_id: 'ins_109511',
        initial_products: productConfig.products,
        options: {}
      };

      // Apply additional sandbox create params first if they exist
      if (productConfig.additionalSandboxCreateParams) {
        const additionalParams = productConfig.additionalSandboxCreateParams;
        // Deep merge: handle nested options object properly
        Object.keys(additionalParams).forEach(key => {
          if (key === 'options' && typeof additionalParams.options === 'object') {
            // Merge options objects
            sandboxFullConfig.options = {
              ...sandboxFullConfig.options,
              ...additionalParams.options
            };
          } else {
            sandboxFullConfig[key] = additionalParams[key];
          }
        });
      }

      // Add webhook URL if available (will override or add to existing options)
      if (effectiveWebhookConfigUrl) {
        sandboxFullConfig.options.webhook = effectiveWebhookConfigUrl;
      }

      setSandboxConfig(sandboxFullConfig);
      
      // In Zap Mode, bypass the preview modal and go straight to sandbox token creation
      if (zapMode) {
        handleProceedWithBypassLink(sandboxFullConfig);
      } else {
        setModalState('preview-sandbox-config');
        setShowModal(true);
      }
      return;
    }

    // Build the FULL configuration that will be sent to Plaid
    const fullConfig: any = {
      link_customization_name: 'flash',
      user: includePhoneNumber 
        ? { client_user_id: generateClientUserId(), phone_number: '+14155550011' }
        : { client_user_id: generateClientUserId() },
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

    // Hosted Link enablement
    if (hostedLinkEnabled) {
      fullConfig.hosted_link = {};
      if (effectiveWebhookConfigUrl) {
        fullConfig.webhook = effectiveWebhookConfigUrl;
      }
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

  const showUserCreatePreview = (productId: string) => {
    const productConfig = getProductConfigById(productId);
    if (!productConfig) {
      return;
    }

    // Build the /user/create configuration based on legacy toggle
    let userConfig: any;

    // Multi-item Link (non-CRA): /user/create only needs client_user_id
    // Upgrade Mode: include identity (or consumer_report_user_identity) like CRA flows.
    // Keep CRA behavior unchanged.
    const isNonCraMultiItemUserCreate = multiItemLinkEnabled && !productConfig.isCRA;
    const isUpgradeModeUserCreate = productId === 'link-upgrade-mode';
    
    if (isNonCraMultiItemUserCreate) {
      userConfig = {
        client_user_id: 'multi_item_user_' + Date.now(),
      };
    } else if (isUpgradeModeUserCreate && useLegacyUserToken) {
      userConfig = {
        client_user_id: 'upgrade_mode_user_' + Date.now(),
        consumer_report_user_identity: {
          first_name: 'Flash',
          last_name: 'User',
          ssn_last_4: '1234',
          date_of_birth: '1970-01-01',
          phone_numbers: ['+14155550011'],
          emails: ['email@example.com'],
          primary_address: {
            city: 'Greenville',
            region: 'SC',
            street: '650 N Academy St',
            postal_code: '29601',
            country: 'US',
          },
        },
      };
    } else if (isUpgradeModeUserCreate) {
      userConfig = {
        client_user_id: 'upgrade_mode_user_' + Date.now(),
        identity: {
          name: {
            given_name: 'Test',
            family_name: 'User',
          },
          date_of_birth: '1970-01-31',
          emails: [{ data: 'test@email.com', primary: true }],
          phone_numbers: [{ data: '+14155550011', primary: true }],
          addresses: [
            {
              street_1: '100 Grey St',
              city: 'San Francisco',
              region: 'CA',
              country: 'US',
              postal_code: '94109',
              primary: true,
            },
          ],
          id_numbers: [{ value: '1234', type: 'us_ssn_last_4' }],
        },
      };
    } else if (layerMode && productConfig.isCRA && !useLegacyUserToken) {
      // Layer + CRA (user_id flow): identity will be collected in Layer and persisted later via /user/update.
      userConfig = {
        client_user_id: 'flash_cra_user_' + Date.now(),
      };
    } else if (useLegacyUserToken) {
      // Legacy format using consumer_report_user_identity
      userConfig = {
        client_user_id: 'flash_cra_user_' + Date.now(),
        consumer_report_user_identity: {
          first_name: 'Flash',
          last_name: 'User',
          ssn_last_4: '1234',
          date_of_birth: '1970-01-01',
          phone_numbers: ['+14155550011'],
          emails: ['email@example.com'],
          primary_address: {
            city: 'Greenville',
            region: 'SC',
            street: '650 N Academy St',
            postal_code: '29601',
            country: 'US'
          }
        }
      };
    } else {
      // New format using identity object
      userConfig = {
        client_user_id: 'flash_cra_user_' + Date.now(),
        identity: {
          name: {
            given_name: 'Test',
            family_name: 'User'
          },
          date_of_birth: '1970-01-31',
          emails: [
            { data: 'test@email.com', primary: true }
          ],
          phone_numbers: [
            { data: '+14155550011', primary: true }
          ],
          addresses: [
            {
              street_1: '100 Grey St',
              city: 'San Francisco',
              region: 'CA',
              country: 'US',
              postal_code: '94109',
              primary: true
            }
          ],
          id_numbers: [
            { value: '1234', type: 'us_ssn_last_4' }
          ]
        }
      };
    }

    setUserCreateConfig(userConfig);
    setModalState('preview-user-create');
    setShowModal(true);
  };

  const handleProceedWithUserCreate = async (configOverride?: any) => {
    // User approved the /user/create config, now call the API
    setModalState('processing-user-create');

    try {
      const configToUse = configOverride || userCreateConfig;
      
      console.log('[Frontend] Creating user');

      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      const isNonCraMultiItemUserCreate = multiItemLinkEnabled && !productConfig?.isCRA;
      const isUpgradeMode = effectiveProductId === 'link-upgrade-mode';
      
      const response = await fetch('/api/user-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          isNonCraMultiItemUserCreate
            ? {
                // Non-CRA Multi-item: only client_user_id is required
                client_user_id:
                  String(configToUse?.client_user_id || '').trim() ||
                  'multi_item_user_' + Date.now(),
              }
            : {
                ...configToUse,
                useLegacyUserToken,
              }
        ),
      });
      
      const data = await response.json();
      
      // Check for API errors
      if (response.status >= 400) {
        setErrorData(data);
        setApiStatusCode(response.status);
        setModalState('api-error');
        return;
      }
      
      // Store the user_id or user_token from the response
      const newUserId = data.user_id || null;
      const newUserToken = data.user_token || null;
      
      // When using legacy mode (user_token), clear user_id and vice versa
      // to ensure only one parameter is available for subsequent calls
      if (isNonCraMultiItemUserCreate) {
        // Multi-item non-CRA: always use user_id
        setUserId(newUserId);
        setUserToken(null);
        setUsedUserToken(false);
      } else if (useLegacyUserToken) {
        // Legacy mode: only store user_token
        setUserId(null);
        setUserToken(newUserToken);
        setUsedUserToken(true);
      } else {
        // New mode: only store user_id
        setUserId(newUserId);
        setUserToken(null);
        setUsedUserToken(false);
      }

      // Upgrade Mode: after /user/create, proceed to /link/token/create config editor.
      // We include an empty access_token that must be filled in by the user.
      if (isUpgradeMode) {
        const client_user_id = String(configToUse?.client_user_id || '').trim();
        if (!client_user_id) {
          setErrorData({ error: 'MISSING_CLIENT_USER_ID', message: 'client_user_id is required for Upgrade Mode.' });
          setApiStatusCode(400);
          setModalState('api-error');
          setShowModal(true);
          return;
        }
        if (!effectiveWebhookConfigUrl) {
          setErrorData({ error: 'WEBHOOK_URL_REQUIRED', message: 'Configure a webhook URL in Settings before using Upgrade Mode.' });
          setApiStatusCode(400);
          setModalState('api-error');
          setShowModal(true);
          return;
        }

        const cfg: any = {
          link_customization_name: 'flash',
          client_name: 'Plaid Flash',
          country_codes: ['US'],
          language: 'en',
          products: ['cra_base_report'],
          consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
          cra_options: { days_requested: 365 },
          webhook: effectiveWebhookConfigUrl,
          access_token: '',
          ...(useLegacyUserToken && newUserToken ? { user_token: newUserToken } : newUserId ? { user_id: newUserId } : {}),
          user: {
            client_user_id,
            ...(includePhoneNumber ? { phone_number: '+14155550011' } : {}),
          },
        };

        setLinkTokenConfig(cfg);
        setModalState('preview-config');
        setShowModal(true);
        return;
      }

      // Demo Mode CRA bootstrap: after /user/create, resume pending /link/token/create preview
      if (demoMode && isDemoModeStarting && demoPendingLinkTokenConfig) {
        const pendingCfg: any = { ...demoPendingLinkTokenConfig };

        // Add user_id or user_token based on legacy toggle (same as normal CRA flow)
        if (useLegacyUserToken && newUserToken) {
          pendingCfg.user_token = newUserToken;
          setUsedUserToken(true);
        } else if (newUserId) {
          pendingCfg.user_id = newUserId;
          setUsedUserToken(false);
        } else if (newUserToken) {
          pendingCfg.user_token = newUserToken;
          setUsedUserToken(true);
        }

        setDemoPendingLinkTokenConfig(null);
        setLinkTokenConfig(pendingCfg);
        setModalState('preview-config');
        setShowModal(true);
        return;
      }

      // Layer legacy mode: continue into /session/token/create by passing user_token under user.user_id
      if (layerMode && layerPendingUserCreate) {
        const productIdForLayer =
          layerPendingProductId || selectedGrandchildProduct || selectedChildProduct || selectedProduct;
        const clientUserIdForSession = String(configToUse?.client_user_id || userCreateConfig?.client_user_id || '').trim();

        setLayerPendingUserCreate(false);
        setLayerPendingProductId(null);
        if (productIdForLayer) {
          if (!clientUserIdForSession) {
            setErrorData({
              error: 'LAYER_MISSING_CLIENT_USER_ID',
              message: 'Missing client_user_id for Layer session token creation. Please edit /user/create config and try again.',
            });
            setApiStatusCode(400);
            setModalState('api-error');
            setShowModal(true);
            return;
          }
          if (!newUserId) {
            setErrorData({
              error: 'LAYER_MISSING_USER_ID',
              message: 'Plaid did not return a user_id from /user/create. Layer requires user_id.',
              response: data,
            });
            setApiStatusCode(502);
            setModalState('api-error');
            setShowModal(true);
            return;
          }

          await createLayerSessionToken(productIdForLayer, { client_user_id: clientUserIdForSession, user_id: newUserId });
        } else {
          setErrorData({
            error: 'LAYER_MISSING_PRODUCT',
            message: 'Missing product context for Layer session token creation.',
          });
          setApiStatusCode(500);
          setModalState('api-error');
          setShowModal(true);
        }
        return;
      }

      // Now show the link token config preview - pass values directly since state update is async
      showCRALinkConfigPreview(newUserId, newUserToken);
    } catch (error: any) {
      console.error('Error creating user:', error);
      setErrorMessage('Failed to create user. Please try again.');
      setModalState('error');
      
      // Reset after a delay
      setTimeout(() => {
        setShowModal(false);
        setModalState('loading');
        setShowProductModal(true);
      }, 3000);
    }
  };

  const showCRALinkConfigPreview = (userIdParam?: string | null, userTokenParam?: string | null) => {
    const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
    const productConfig = getProductConfigById(effectiveProductId!);
    if (!productConfig) {
      return;
    }

    // Use passed params or fall back to state (for cases where state is already set)
    const effectiveUserId = userIdParam ?? userId;
    const effectiveUserToken = userTokenParam ?? userToken;

    // Bypass Link mode for CRA products: build sandbox config instead
    if (bypassLink) {
      const sandboxFullConfig: any = {
        institution_id: 'ins_109511',
        initial_products: productConfig.products,
        options: {}
      };

      // Apply additional sandbox create params first if they exist
      if (productConfig.additionalSandboxCreateParams) {
        const additionalParams = productConfig.additionalSandboxCreateParams;
        // Deep merge: handle nested options object properly
        Object.keys(additionalParams).forEach(key => {
          if (key === 'options' && typeof additionalParams.options === 'object') {
            // Merge options objects
            sandboxFullConfig.options = {
              ...sandboxFullConfig.options,
              ...additionalParams.options
            };
          } else {
            sandboxFullConfig[key] = additionalParams[key];
          }
        });
      }

      // Add webhook URL if available (will override or add to existing options)
      if (effectiveWebhookConfigUrl) {
        sandboxFullConfig.options.webhook = effectiveWebhookConfigUrl;
      }

      // Add user_id or user_token for CRA products
      if (useLegacyUserToken && effectiveUserToken) {
        sandboxFullConfig.user_token = effectiveUserToken;
        setUsedUserToken(true);
      } else if (effectiveUserId) {
        sandboxFullConfig.user_id = effectiveUserId;
        setUsedUserToken(false);
      } else if (effectiveUserToken) {
        sandboxFullConfig.user_token = effectiveUserToken;
        setUsedUserToken(true);
      }

      setSandboxConfig(sandboxFullConfig);
      
      // In Zap Mode, bypass the preview modal and go straight to sandbox token creation
      if (zapMode) {
        handleProceedWithBypassLink(sandboxFullConfig);
      } else {
        setModalState('preview-sandbox-config');
      }
      return;
    }

    // Build the FULL configuration for CRA products (and Multi-item Link, when enabled)
    const fullConfig: any = {
      link_customization_name: 'flash',
      user: includePhoneNumber
        ? {
            client_user_id: userCreateConfig?.client_user_id || generateClientUserId('flash_cra_user_'),
            phone_number: '+14155550011',
          }
        : { client_user_id: userCreateConfig?.client_user_id || generateClientUserId('flash_cra_user_') },
      client_name: 'Plaid Flash',
      products: productConfig.products,
      country_codes: ['US'],
      language: 'en'
    };

    // Enable Multi-item Link whenever the global toggle is on
    if (multiItemLinkEnabled) {
      fullConfig.enable_multi_item_link = true;
    }

    // Hosted Link enablement
    if (hostedLinkEnabled) {
      fullConfig.hosted_link = {};
    }

    // Add user_id or user_token based on legacy toggle
    // When legacy toggle is enabled, prioritize user_token over user_id
    if (useLegacyUserToken && effectiveUserToken) {
      fullConfig.user_token = effectiveUserToken;
      setUsedUserToken(true); // Remember we used user_token
    } else if (effectiveUserId) {
      fullConfig.user_id = effectiveUserId;
      setUsedUserToken(false); // Remember we used user_id
    } else if (effectiveUserToken) {
      fullConfig.user_token = effectiveUserToken;
      setUsedUserToken(true); // Remember we used user_token
    }

    // Add required_if_supported_products if not empty
    if (productConfig.required_if_supported && productConfig.required_if_supported.length > 0) {
      fullConfig.required_if_supported_products = productConfig.required_if_supported;
    }

    // Add additional link params if they exist
    if (productConfig.additionalLinkParams) {
      Object.assign(fullConfig, productConfig.additionalLinkParams);
    }

    // Add webhook URL for products that require it (and always for Multi-item Link)
    if (effectiveWebhookConfigUrl && (productConfig.requiresWebhook || multiItemLinkEnabled)) {
      fullConfig.webhook = effectiveWebhookConfigUrl;
    }

    // Hosted Link relies on webhooks to deliver public_token
    if (hostedLinkEnabled && effectiveWebhookConfigUrl) {
      fullConfig.webhook = effectiveWebhookConfigUrl;
    }

    setLinkTokenConfig(fullConfig);
    setModalState('preview-config');
  };

  const handleGoBackToUserCreate = () => {
    // Go back to user create preview
    setModalState('preview-user-create');
    setIsEditingConfig(false);
    setConfigError(null);
  };

  const handleToggleUserCreateEditMode = () => {
    if (!isEditingUserCreateConfig) {
      // Entering edit mode - populate editedUserCreateConfig with current config
      setEditedUserCreateConfig(JSON.stringify(userCreateConfig, null, 2));
      setUserCreateConfigError(null);
    }
    setIsEditingUserCreateConfig(!isEditingUserCreateConfig);
  };

  const handleCancelUserCreateEdit = () => {
    setIsEditingUserCreateConfig(false);
    setUserCreateConfigError(null);
    setEditedUserCreateConfig('');
  };

  const validateUserUpdatePayload = (payload: any): string | null => {
    if (!payload || typeof payload !== 'object') {
      return 'Invalid JSON: payload must be an object';
    }

    const identity = payload.identity;
    if (!identity || typeof identity !== 'object') {
      return 'Invalid JSON: identity object is required';
    }

    const addresses = identity.addresses;
    if (Array.isArray(addresses) && addresses.length > 0) {
      const addr0 = addresses[0] || {};
      const hasAnyAddressDetails = ['street_1', 'street_2', 'city', 'region', 'postal_code', 'country'].some((k) => {
        const v = (addr0 as any)?.[k];
        return typeof v === 'string' ? v.trim().length > 0 : v != null;
      });
      const street1 = typeof addr0?.street_1 === 'string' ? addr0.street_1.trim() : '';
      if (hasAnyAddressDetails && !street1) {
        return 'Invalid identity: addresses[0].street_1 is required when providing address details';
      }
    }

    return null;
  };

  const validateLinkTokenCreateConfig = (cfg: any): string | null => {
    if (!cfg || typeof cfg !== 'object') return 'Invalid JSON: configuration must be an object';
    if (Object.prototype.hasOwnProperty.call(cfg, 'access_token')) {
      const v = typeof (cfg as any).access_token === 'string' ? String((cfg as any).access_token).trim() : '';
      if (!v) return 'access_token is required. Please set it in the /link/token/create config.';
    }
    const isUserBasedUpdate = (typeof cfg.user_id === 'string' && cfg.user_id.trim().length > 0) || (typeof cfg.user_token === 'string' && cfg.user_token.trim().length > 0);
    if (!isUserBasedUpdate) return null;

    const user = (cfg as any).user;
    if (!user || typeof user !== 'object' || Array.isArray(user)) {
      return 'Update Mode (user_id/user_token) requires a user object with user.client_user_id.';
    }
    const clientUserId = typeof (user as any).client_user_id === 'string' ? (user as any).client_user_id.trim() : '';
    if (!clientUserId) {
      return 'Update Mode (user_id/user_token) requires user.client_user_id. Please set it in the /link/token/create config.';
    }
    return null;
  };

  function sanitizeUserUpdateConfigForDisplay(config: any) {
    if (!config || typeof config !== 'object') return config;
    const copy: any = { ...config };
    delete copy.useAltCredentials;
    return copy;
  }

  const handleToggleUserUpdateEditMode = () => {
    if (!isEditingUserUpdateConfig) {
      const displayConfig = sanitizeUserUpdateConfigForDisplay(userUpdateConfig);
      setEditedUserUpdateConfig(JSON.stringify(displayConfig, null, 2));
      setUserUpdateConfigError(null);
    }
    setIsEditingUserUpdateConfig(!isEditingUserUpdateConfig);
  };

  const handleCancelUserUpdateEdit = () => {
    setIsEditingUserUpdateConfig(false);
    setUserUpdateConfigError(null);
    setEditedUserUpdateConfig('');
  };

  const handleProceedWithUserUpdate = async (configOverride?: any) => {
    const pending = craLayerPendingAfterUserUpdate;
    const configToUse = configOverride || userUpdateConfig;
    const validationError = validateUserUpdatePayload(configToUse);

    if (validationError) {
      setUserUpdateConfigError(validationError);
      setModalState('preview-user-update');
      setShowModal(true);
      return;
    }
    if (!pending?.userId || !pending?.webhook) {
      setErrorData({
        error: 'LAYER_CRA_MISSING_CONTEXT',
        message: 'Missing Layer + CRA pending context for report creation. Please restart the flow.',
      });
      setApiStatusCode(500);
      setModalState('api-error');
      setShowModal(true);
      return;
    }

    setModalState('layer-processing-user-update');
    setShowModal(true);
    try {
      const userUpdateResp = await fetch('/api/user-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: pending.userId,
          identity: configToUse.identity,
        }),
      });
      const userUpdateJson = await userUpdateResp.json();
      if (userUpdateResp.status >= 400) {
        setErrorData(userUpdateJson);
        setApiStatusCode(userUpdateResp.status);
        setModalState('api-error');
        setShowModal(true);
        return;
      }

      setModalState('layer-processing-check-report-create');
      setShowModal(true);
      const createResp = await fetch('/api/cra-check-report-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: pending.userId,
          webhook: pending.webhook,
          days_requested: 365,
          consumer_report_permissible_purpose: 'LEGITIMATE_BUSINESS_NEED_OTHER',
          products: pending.productsToCreate,
        }),
      });
      const createJson = await createResp.json();
      if (createResp.status >= 400) {
        setErrorData(createJson);
        setApiStatusCode(createResp.status);
        setModalState('api-error');
        setShowModal(true);
        return;
      }

      // Step D: wait for CHECK_REPORT / USER_CHECK_REPORT_READY webhook (reuse hosted-waiting view)
      setHostedWaitingMode('cra_check_report');
      setCraCheckReportExpectedUserId(pending.userId);
      setCraCheckReportManualReady(false);
      setHostedLinkUrl(null);
      setHostedLinkManualPayload('');
      setHostedLinkManualParseError(null);
      setHostedLinkExtractedPublicTokens([]);
      setWebhooks([]);
      setCraLayerPendingAfterUserUpdate(null);
      setModalState('hosted-waiting');
      setShowModal(true);
    } catch (error: any) {
      setErrorData({
        error: 'LAYER_CRA_USER_UPDATE_FAILED',
        message: error?.message || 'Failed to update CRA user identity.',
      });
      setApiStatusCode(500);
      setModalState('api-error');
      setShowModal(true);
    }
  };

  const handleSaveAndProceedUserUpdate = async () => {
    try {
      const parsed = JSON.parse(editedUserUpdateConfig);
      // Never allow internal-only params to be persisted from the editor.
      if (parsed && typeof parsed === 'object') {
        delete (parsed as any).useAltCredentials;
      }

      const validationError = validateUserUpdatePayload(parsed);
      if (validationError) {
        setUserUpdateConfigError(validationError);
        return;
      }

      // Ensure we always send the real user_id for this flow.
      const pending = craLayerPendingAfterUserUpdate;
      if (pending?.userId) {
        (parsed as any).user_id = pending.userId;
      }

      setUserUpdateConfig(parsed);
      setUserUpdateConfigError(null);
      setIsEditingUserUpdateConfig(false);
      await handleProceedWithUserUpdate(parsed);
    } catch (error: any) {
      setUserUpdateConfigError(`Invalid JSON: ${error.message}`);
    }
  };

  const handleSaveAndProceedUserCreate = async () => {
    try {
      // Validate JSON first
      const parsed = JSON.parse(editedUserCreateConfig);
      
      // Update config and reset edit state
      setUserCreateConfig(parsed);
      setUserCreateConfigError(null);
      setIsEditingUserCreateConfig(false);
      
      // Proceed with user creation
      handleProceedWithUserCreate(parsed);
    } catch (error: any) {
      setUserCreateConfigError(`Invalid JSON: ${error.message}`);
    }
  };

  const handleToggleLayerPhoneSubmitEditMode = () => {
    if (!isEditingLayerPhoneSubmitConfig) {
      setEditedLayerPhoneSubmitConfig(JSON.stringify(layerPhoneSubmitConfig, null, 2));
      setLayerPhoneSubmitConfigError(null);
    }
    setIsEditingLayerPhoneSubmitConfig(!isEditingLayerPhoneSubmitConfig);
  };

  const handleCancelLayerPhoneSubmitEdit = () => {
    setIsEditingLayerPhoneSubmitConfig(false);
    setLayerPhoneSubmitConfigError(null);
    setEditedLayerPhoneSubmitConfig('');
  };

  const handleSaveLayerPhoneSubmitConfig = () => {
    try {
      const parsed = JSON.parse(editedLayerPhoneSubmitConfig);
      const phone_number = String(parsed?.phone_number || '').trim();
      if (!phone_number) {
        setLayerPhoneSubmitConfigError('Invalid JSON: phone_number is required');
        return;
      }

      setLayerPhoneSubmitConfig({ phone_number });
      setLayerPhoneSubmitConfigError(null);
      setIsEditingLayerPhoneSubmitConfig(false);
    } catch (error: any) {
      setLayerPhoneSubmitConfigError(`Invalid JSON: ${error.message}`);
    }
  };

  const handleToggleLayerDobSubmitEditMode = () => {
    if (!isEditingLayerDobSubmitConfig) {
      setEditedLayerDobSubmitConfig(JSON.stringify(layerDobSubmitConfig, null, 2));
      setLayerDobSubmitConfigError(null);
    }
    setIsEditingLayerDobSubmitConfig(!isEditingLayerDobSubmitConfig);
  };

  const handleCancelLayerDobSubmitEdit = () => {
    setIsEditingLayerDobSubmitConfig(false);
    setLayerDobSubmitConfigError(null);
    setEditedLayerDobSubmitConfig('');
  };

  const handleSaveLayerDobSubmitConfig = () => {
    try {
      const parsed = JSON.parse(editedLayerDobSubmitConfig);
      const date_of_birth = String(parsed?.date_of_birth || '').trim();
      if (!date_of_birth) {
        setLayerDobSubmitConfigError('Invalid JSON: date_of_birth is required');
        return;
      }

      setLayerDobSubmitConfig({ date_of_birth });
      setLayerDateOfBirth(date_of_birth);
      setLayerDobSubmitConfigError(null);
      setIsEditingLayerDobSubmitConfig(false);
    } catch (error: any) {
      setLayerDobSubmitConfigError(`Invalid JSON: ${error.message}`);
    }
  };

  const handleProceedWithConfig = async (configOverride?: any) => {
    // User approved the config, now fetch the link token using the (potentially edited) linkTokenConfig
    // In Zap Mode, configOverride is passed directly to avoid state timing issues
    const configToUse = configOverride || linkTokenConfig;
    const validationError = validateLinkTokenCreateConfig(configToUse);
    if (validationError) {
      setConfigError(validationError);
      setEditedConfig(JSON.stringify(configToUse, null, 2));
      setIsEditingConfig(true);
      setModalState('preview-config');
      setShowModal(true);
      return;
    }

    setShowModal(false);
    
    // If we're starting Demo Mode, trigger the UI changes now
    if (isDemoModeStarting) {
      setShowButton(false);
      setShowEventLogs(true);
      setEventLogsPosition('right');
      setIsDemoModeStarting(false); // Reset the flag
    }
    
    try {
      // Hosted Link: open a placeholder tab synchronously to avoid popup blockers,
      // and show the waiting UI immediately so the user isn't left on a blank screen.
      if (hostedLinkEnabled) {
        try {
          const popup = window.open('about:blank', '_blank');
          if (popup) {
            // Best-effort hardening
            (popup as any).opener = null;
            hostedLinkPopupRef.current = popup;
          } else {
            hostedLinkPopupRef.current = null;
          }
        } catch {
          hostedLinkPopupRef.current = null;
        }

        setHostedLinkActive(true);
        setHostedLinkUrl(null);
        setHostedLinkManualPayload('');
        setHostedLinkManualParseError(null);
        setHostedLinkExtractedPublicTokens([]);
        setHostedWaitingMode('hosted_link');
        setCraCheckReportExpectedUserId(null);
        setCraCheckReportManualReady(false);
        setShowEventLogs(false);
        setShowWebhookPanel(false);
        setModalState('hosted-waiting');
        setShowModal(true);
      }

      const response = await fetch('/api/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...configToUse }),
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

      if (hostedLinkEnabled) {
        if (data.hosted_link_url) {
          setHostedLinkActive(true);
          setHostedLinkUrl(data.hosted_link_url);
          setHostedLinkManualPayload('');
          setHostedLinkManualParseError(null);
          setHostedLinkExtractedPublicTokens([]);
          setHostedWaitingMode('hosted_link');
          setCraCheckReportExpectedUserId(null);
          setCraCheckReportManualReady(false);
          setShowEventLogs(false);
          setShowWebhookPanel(false);
          setModalState('hosted-waiting');
          setShowModal(true);

          // Navigate the placeholder tab if we have one; otherwise try opening (may be blocked)
          try {
            if (hostedLinkPopupRef.current) {
              hostedLinkPopupRef.current.location.href = data.hosted_link_url;
            } else {
              window.open(data.hosted_link_url, '_blank');
            }
          } catch {
            // User can still open via the UI
          }
        } else {
          // Avoid a blank screen if Plaid doesn't return hosted_link_url
          setHostedLinkActive(false);
          setHostedLinkUrl(null);
          setErrorData({
            error_code: 'HOSTED_LINK_URL_MISSING',
            error_message:
              'Hosted Link is enabled, but Plaid did not return hosted_link_url from /link/token/create. Ensure the request includes hosted_link: {}.',
            link_token: data.link_token,
          });
          setApiStatusCode(500);
          setModalState('api-error');
          setShowModal(true);
          setShowWelcome(false);
        }
      }
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

    // Cancel any in-progress Layer setup
    setLayerPendingUserCreate(false);
    setLayerPendingProductId(null);
    
    // Reset demo mode starting flag if it was set
    if (isDemoModeStarting) {
      setIsDemoModeStarting(false);
    }
    
    // Navigate back through the 3-level hierarchy
    if (selectedGrandchildProduct) {
      // Go back from grandchild to child modal
      setSelectedGrandchildProduct(null);
      setShowGrandchildModal(true);
    } else if (selectedChildProduct) {
      // Go back from child to parent modal
      setSelectedChildProduct(null);
      setShowChildModal(true);
    } else {
      // Go back to root product modal
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

      const validationError = validateLinkTokenCreateConfig(parsed);
      if (validationError) {
        setConfigError(validationError);
        return;
      }
      
      // Close modal immediately to avoid showing read-only view
      setShowModal(false);

      // Hosted Link: open a placeholder tab synchronously (user gesture) to avoid popup blockers.
      // We'll navigate it once we receive hosted_link_url.
      if (hostedLinkEnabled) {
        try {
          const popup = window.open('about:blank', '_blank');
          if (popup) {
            (popup as any).opener = null;
            hostedLinkPopupRef.current = popup;
          } else {
            hostedLinkPopupRef.current = null;
          }
        } catch {
          hostedLinkPopupRef.current = null;
        }

        setHostedLinkActive(true);
        setHostedLinkUrl(null);
        setHostedLinkManualPayload('');
        setHostedLinkManualParseError(null);
        setHostedLinkExtractedPublicTokens([]);
        setShowEventLogs(false);
        setShowWebhookPanel(false);
        setModalState('hosted-waiting');
        setShowModal(true);
      }
      
      // Update config and reset edit state
      setLinkTokenConfig(parsed);
      setConfigError(null);
      setIsEditingConfig(false);

      // Hybrid detection (CRA product selected + edited config includes any non-CRA products)
      try {
        const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
        const selectedCfg = effectiveProductId ? getProductConfigById(effectiveProductId) : undefined;
        const isCraSelected = !!selectedCfg?.isCRA;

        const productsArr = Array.isArray(parsed.products) ? parsed.products : [];
        const requiredArr = Array.isArray(parsed.required_if_supported_products)
          ? parsed.required_if_supported_products
          : [];
        const optionalArr = Array.isArray(parsed.optional_products) ? parsed.optional_products : [];

        const merged = [...productsArr, ...requiredArr, ...optionalArr].filter(
          (p): p is string => typeof p === 'string' && p.length > 0
        );
        const unique = Array.from(new Set(merged));

        const craProducts = unique.filter((p) => p.startsWith('cra_'));
        const nonCraProducts = unique.filter((p) => !p.startsWith('cra_'));

        const hybridActive = isCraSelected && nonCraProducts.length > 0;
        setHybridModeActive(hybridActive);
        setHybridCraProducts(craProducts);
        setHybridNonCraProducts(nonCraProducts);
      } catch (e) {
        // If parsing logic fails, default to non-hybrid
        setHybridModeActive(false);
        setHybridCraProducts([]);
        setHybridNonCraProducts([]);
      }
      
      // Proceed with link token creation
      try {
        const response = await fetch('/api/create-link-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({ ...parsed }),
        });
        
        const data = await response.json();
        
        // Check for API errors
        if (response.status >= 400) {
          if (hostedLinkEnabled) {
            try {
              hostedLinkPopupRef.current?.close();
            } catch {
              // ignore
            }
            hostedLinkPopupRef.current = null;
          }
          setErrorData(data);
          setApiStatusCode(response.status);
          setModalState('api-error');
          setShowModal(true);
          setShowWelcome(false);
          return;
        }
        
        setLinkToken(data.link_token);

        if (hostedLinkEnabled) {
          if (data.hosted_link_url) {
            setHostedLinkActive(true);
            setHostedLinkUrl(data.hosted_link_url);
            setHostedLinkManualPayload('');
            setHostedLinkManualParseError(null);
            setHostedLinkExtractedPublicTokens([]);
            setShowEventLogs(false);
            setShowWebhookPanel(false);
            setModalState('hosted-waiting');
            setShowModal(true);
            try {
              if (hostedLinkPopupRef.current) {
                hostedLinkPopupRef.current.location.href = data.hosted_link_url;
              } else {
                window.open(data.hosted_link_url, '_blank');
              }
            } catch {
              // User can still open via the UI
            }
          } else {
            // Avoid a blank screen if Plaid doesn't return hosted_link_url
            if (hostedLinkEnabled) {
              try {
                hostedLinkPopupRef.current?.close();
              } catch {
                // ignore
              }
              hostedLinkPopupRef.current = null;
            }
            setHostedLinkActive(false);
            setHostedLinkUrl(null);
            setErrorData({
              error_code: 'HOSTED_LINK_URL_MISSING',
              error_message:
                'Hosted Link is enabled, but Plaid did not return hosted_link_url from /link/token/create. Ensure the request includes hosted_link: {}.',
              link_token: data.link_token,
            });
            setApiStatusCode(500);
            setModalState('api-error');
            setShowModal(true);
            setShowWelcome(false);
          }
        }
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

  // Product API Preview Handlers
  const handleToggleEditProductApiMode = () => {
    if (!isEditingProductApiConfig) {
      // Entering edit mode - populate editedProductApiConfig with current config
      setEditedProductApiConfig(JSON.stringify(productApiConfig, null, 2));
      setProductApiConfigError(null);
    }
    setIsEditingProductApiConfig(!isEditingProductApiConfig);
  };

  const handleSaveProductApiConfig = () => {
    try {
      const parsed = JSON.parse(editedProductApiConfig);
      setProductApiConfig(parsed);
      setProductApiConfigError(null);
      setIsEditingProductApiConfig(false);
      return true;
    } catch (error: any) {
      setProductApiConfigError(`Invalid JSON: ${error.message}`);
      return false;
    }
  };

  const handleCancelProductApiEdit = () => {
    setIsEditingProductApiConfig(false);
    setProductApiConfigError(null);
    setEditedProductApiConfig('');
  };

  // Sandbox Config Preview Handlers (for Bypass Link mode)
  const handleToggleSandboxConfigEditMode = () => {
    if (!isEditingSandboxConfig) {
      // Entering edit mode - populate editedSandboxConfig with current config
      setEditedSandboxConfig(JSON.stringify(sandboxConfig, null, 2));
      setSandboxConfigError(null);
    }
    setIsEditingSandboxConfig(!isEditingSandboxConfig);
  };

  const handleSaveSandboxConfig = () => {
    try {
      const parsed = JSON.parse(editedSandboxConfig);
      setSandboxConfig(parsed);
      setSandboxConfigError(null);
      setIsEditingSandboxConfig(false);
      return true;
    } catch (error: any) {
      setSandboxConfigError(`Invalid JSON: ${error.message}`);
      return false;
    }
  };

  const handleCancelSandboxConfigEdit = () => {
    setIsEditingSandboxConfig(false);
    setSandboxConfigError(null);
    setEditedSandboxConfig('');
  };

  const handleSaveAndProceedWithSandboxConfig = async () => {
    try {
      // Validate JSON first
      const parsed = JSON.parse(editedSandboxConfig);
      
      // Close modal immediately
      setShowModal(false);
      
      // Update config and reset edit state
      setSandboxConfig(parsed);
      setSandboxConfigError(null);
      setIsEditingSandboxConfig(false);
      
      // Proceed with bypass link flow
      await handleProceedWithBypassLink(parsed);
    } catch (error: any) {
      setSandboxConfigError(`Invalid JSON: ${error.message}`);
    }
  };

  const handleSaveAndProceedWithProductApi = async () => {
    try {
      // Validate JSON first
      const parsed = JSON.parse(editedProductApiConfig);
      
      // Close modal immediately to avoid showing read-only view
      setShowModal(false);
      
      // Update config and reset edit state
      setProductApiConfig(parsed);
      setProductApiConfigError(null);
      setIsEditingProductApiConfig(false);
      
      // Show processing state
      setModalState('processing-product');
      setShowModal(true);
      
      // Proceed with product API call
      try {
        const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
        const productIdForApi =
          effectiveProductId === 'link-upgrade-mode' ? productApiTargetProductId || effectiveProductId : effectiveProductId;
        const productConfig = getProductConfigById(productIdForApi!);
        
        if (!productConfig || !productConfig.apiEndpoint) {
          throw new Error('Product API endpoint not configured');
        }
        
        // Harden edited configs: re-inject internal flags + access_token if missing
        const tokenToUse = accessTokenRef.current || accessToken;
        const bodyToSend: any = { ...parsed };
        // Internal-only: always force the current session access_token for non-CRA.
        if (!productConfig.isCRA) {
          if (!tokenToUse) throw new Error('Missing access_token for product API call');
          bodyToSend.access_token = tokenToUse;
        }

        const productResponse = await fetch(productConfig.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyToSend),
        });

        const productData = await productResponse.json();
        
        // Check for API errors
        if (productResponse.status >= 400) {
          setErrorData(productData);
          setApiStatusCode(productResponse.status);
          setModalState('api-error');
          setShowModal(true);
          setShowWelcome(false);
          return;
        }
        
        setProductData(productData);
        setApiStatusCode(productResponse.status);
        setModalState('success');
      } catch (error) {
        console.error('Error fetching product data:', error);
        setErrorMessage('Failed to fetch product data. Please try again.');
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
      setProductApiConfigError(`Invalid JSON: ${error.message}`);
    }
  };

  const handleProceedWithProductApi = async (configOverride?: any) => {
    // User approved the product API config, now make the API call
    setShowModal(false);
    setModalState('processing-product');
    setShowModal(true);
    
    try {
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productIdForApi =
        effectiveProductId === 'link-upgrade-mode' ? productApiTargetProductId || effectiveProductId : effectiveProductId;
      const productConfig = getProductConfigById(productIdForApi!);
      
      if (!productConfig || !productConfig.apiEndpoint) {
        throw new Error('Product API endpoint not configured');
      }

      // Use configOverride if provided; otherwise prefer unsaved edits so that edits are always applied when proceeding
      let configToUse = configOverride;
      if (configToUse == null && editedProductApiConfig.trim()) {
        try {
          configToUse = JSON.parse(editedProductApiConfig);
        } catch {
          // Invalid JSON in editor; fall back to saved config
        }
      }
      if (configToUse == null) {
        configToUse = productApiConfig;
      }
      // Keep state in sync when we used unsaved edits
      if (configOverride == null && editedProductApiConfig.trim() && configToUse != null) {
        setProductApiConfig(configToUse);
      }

      const tokenToUse = accessTokenRef.current || accessToken;
      const bodyToSend: any = { ...(configToUse || {}) };
      // Internal-only: always force the current session access_token for non-CRA.
      if (!productConfig.isCRA) {
        if (!tokenToUse) throw new Error('Missing access_token for product API call');
        bodyToSend.access_token = tokenToUse;
      }
      
      const productResponse = await fetch(productConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyToSend),
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
      setApiStatusCode(productResponse.status);
      setModalState('success');
    } catch (error) {
      console.error('Error fetching product data:', error);
      setErrorMessage('Failed to fetch product data. Please try again.');
      setModalState('error');
      setShowModal(true);
      
      // Reset after a delay
      setTimeout(() => {
        setShowModal(false);
        setModalState('loading');
        setShowProductModal(true);
      }, 3000);
    }
  };

  const handleGoBackFromApiError = () => {
    setErrorData(null);
    setApiStatusCode(200);
    const previous = lastStableModalStateRef.current;
    const validStableStates: typeof modalState[] = [
      'preview-user-create', 'preview-user-update', 'preview-config', 'preview-sandbox-config', 'preview-product-api',
      'callback-success', 'callback-exit', 'callback-exit-zap', 'accounts-data', 'update-mode-input',
      'upgrade-mode-pick-product', 'hybrid-step', 'cashflow-updates-pick-item', 'cashflow-updates-webhooks',
      'success', 'error', 'zap-mode-results', 'layer-phone-submit', 'layer-waiting-eligibility', 'layer-dob-submit',
      'layer-identity-match-results',
    ];
    if (previous && validStableStates.includes(previous)) {
      setModalState(previous);
      setShowModal(true);
    } else {
      setModalState('loading');
      setShowProductModal(true);
      setShowModal(false);
    }
  };

  const handleGoBackFromProductApiPreview = () => {
    // User wants to go back from product API preview
    setShowModal(false);
    setProductApiConfig(null);
    setModalState('loading');
    setIsEditingProductApiConfig(false);
    setProductApiConfigError(null);
    
    // Determine where to go back based on product type
    const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
    const productConfig = getProductConfigById(effectiveProductId!);
    
    if (productConfig?.isCRA) {
      // CRA products: go back to callback-success modal
      setModalState('callback-success');
      setShowModal(true);
    } else {
      // Normal products: go back to accounts-data modal
      setModalState('accounts-data');
      setShowModal(true);
    }
  };

  // Settings Modal Handlers
  const handleOpenSettings = () => {
    // Copy current settings to temp state
    setSettingsTab('flash');
    setTempZapMode(zapMode);
    setTempEmbeddedMode(embeddedMode);
    setTempLayerMode(layerMode);
    setTempLayerIdentityMatchEnabled(layerIdentityMatchEnabled);
    setTempDemoMode(demoMode);
    setTempMultiItemLinkEnabled(multiItemLinkEnabled);
    setTempHostedLinkEnabled(hostedLinkEnabled);
    setTempAutoRemoveEnabled(autoRemoveEnabled);
    setTempUseLegacyUserToken(useLegacyUserToken);
    setTempUseAltCredentials(useAltCredentials);
    setTempIncludePhoneNumber(includePhoneNumber);
    setTempBypassLink(bypassLink);
    setTempWebhookUrlOverride(webhookUrlOverride);
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

  const handleSaveSettings = async () => {
    // Commit temp state to main state
    const wasDemoMode = demoMode;
    const willBeDemoMode = tempDemoMode;
    
    setZapMode(tempZapMode);
    setEmbeddedMode(tempEmbeddedMode);
    setLayerMode(tempLayerMode);
    setLayerIdentityMatchEnabled(tempLayerIdentityMatchEnabled);
    setDemoMode(tempDemoMode);
    setMultiItemLinkEnabled(tempMultiItemLinkEnabled);
    setHostedLinkEnabled(tempHostedLinkEnabled);
    setAutoRemoveEnabled(tempAutoRemoveEnabled);
    setUseLegacyUserToken(tempUseLegacyUserToken);
    // Persist Plaid credential mode (cookie-backed)
    try {
      const resp = await fetch('/api/credentials-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useAltCredentials: tempUseAltCredentials }),
      });
      const json = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setAltCredentialsAvailable(!!json.altAvailable);
        setUseAltCredentials(!!json.useAltCredentials);
      } else {
        // Fall back to optimistic UI state if the API errors
        setUseAltCredentials(tempUseAltCredentials);
      }
    } catch {
      setUseAltCredentials(tempUseAltCredentials);
    }
    setIncludePhoneNumber(tempIncludePhoneNumber);
    setBypassLink(tempBypassLink);

    // Persist production webhook URL override (dev continues to use ngrok)
    const trimmedWebhookOverride = tempWebhookUrlOverride.trim();
    setWebhookUrlOverride(trimmedWebhookOverride);
    if (!IS_DEV) {
      try {
        if (trimmedWebhookOverride) {
          localStorage.setItem(WEBHOOK_URL_OVERRIDE_STORAGE_KEY, trimmedWebhookOverride);
        } else {
          localStorage.removeItem(WEBHOOK_URL_OVERRIDE_STORAGE_KEY);
        }
      } catch (e) {
        // Ignore storage errors (privacy mode, etc.)
      }
    }
    
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
    setTempEmbeddedMode(!tempEmbeddedMode);
  };

  const handleToggleIncludePhoneNumber = () => {
    setTempIncludePhoneNumber(!tempIncludePhoneNumber);
  };

  const handleToggleLayer = () => {
    const next = !tempLayerMode;
    setTempLayerMode(next);

    // Layer is incompatible with several Link modes. If enabling Layer, turn those off.
    if (next) {
      setTempEmbeddedMode(false);
      setTempHostedLinkEnabled(false);
      setTempMultiItemLinkEnabled(false);
      setTempBypassLink(false);
    } else {
      // Turning Layer off: also turn off Layer-only subfeatures.
      setTempLayerIdentityMatchEnabled(false);
    }
  };

  const handleToggleLayerIdentityMatch = () => {
    if (!tempLayerMode) return;
    setTempLayerIdentityMatchEnabled(!tempLayerIdentityMatchEnabled);
  };

  const handleToggleDemo = () => {
    const newValue = !tempDemoMode;
    setTempDemoMode(newValue);
    // Zap and Demo are mutually exclusive
    if (newValue) {
      setTempZapMode(false);
    }
  };

  const handleToggleMultiItemLink = () => {
    setTempMultiItemLinkEnabled(!tempMultiItemLinkEnabled);
  };

  const handleToggleHostedLink = () => {
    setTempHostedLinkEnabled(!tempHostedLinkEnabled);
  };

  const parseHostedLinkSessionFinished = (payloadText: string) => {
    const parsed = JSON.parse(payloadText);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON');
    }
    const webhookType = parsed.webhook_type || parsed.webhookType;
    const webhookCode = parsed.webhook_code || parsed.webhookCode;
    if (webhookType !== 'LINK' || webhookCode !== 'SESSION_FINISHED') {
      throw new Error('Expected a LINK/SESSION_FINISHED payload');
    }
    const tokens: string[] = Array.isArray(parsed.public_tokens)
      ? parsed.public_tokens
      : parsed.public_token
        ? [parsed.public_token]
        : [];
    return tokens.filter((t) => typeof t === 'string' && t.length > 0);
  };

  const handleToggleAutoRemove = () => {
    setTempAutoRemoveEnabled(!tempAutoRemoveEnabled);
  };

  const handleToggleLegacyUserToken = () => {
    setTempUseLegacyUserToken(!tempUseLegacyUserToken);
  };

  const handleToggleAltCredentials = () => {
    setTempUseAltCredentials(!tempUseAltCredentials);
  };

  const handleToggleBypassLink = () => {
    setTempBypassLink(!tempBypassLink);
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
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
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
      // Pass accountsData only if it was fetched (not for Signal Balance)
      const requestBody = buildProductRequestBody(
        { access_token },
        productConfig,
        skipAccountsGet ? undefined : accountsData
      );
      
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

  // Bypass Link Mode Handlers
  const handleProceedWithBypassLink = async (sandboxConfigOverride?: any) => {
    // Show creating sandbox item modal
    setModalState('creating-sandbox-item');
    setShowModal(true);
    
    try {
      // Use the configOverride if provided, otherwise use sandboxConfig state
      const configToUse = sandboxConfigOverride || sandboxConfig;
      
      // Call /sandbox/public_token/create
      const response = await fetch('/api/sandbox-public-token-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      body: JSON.stringify({ ...configToUse }),
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
      
      const { public_token } = data;
      
      // Skip Link entirely - go directly to token exchange
      // No onEvent, onExit, or onSuccess callbacks
      await handleBypassLinkSuccess(public_token);
    } catch (error) {
      console.error('Error creating sandbox public token:', error);
      setErrorMessage('Failed to create sandbox public token. Please try again.');
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

  const handleBypassLinkSuccess = async (public_token: string) => {
    try {
      // Get the effective product ID
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);

      // Check if this is a CRA product
      if (productConfig?.isCRA) {
        // CRA products: skip access_token exchange, show product API preview directly
        // Keep showing 'creating-sandbox-item' modal during this process
        try {
          // CRA Cashflow Updates (Monitoring Insights): even in Bypass Link mode, we must run the
          // items -> subscribe -> webhook -> get sequence (not jump straight to /get).
          if (effectiveProductId === 'cra-cashflow-updates') {
            const baseParams: any = {};
            if (usedUserToken && userToken) {
              baseParams.user_token = userToken;
            } else if (userId) {
              baseParams.user_id = userId;
            } else if (userToken) {
              baseParams.user_token = userToken;
            } else {
              throw new Error('Missing user_id/user_token for CRA flow');
            }

            // Reset per-run state so we only gate on fresh webhooks
            setCashflowUpdatesItems([]);
            setCashflowUpdatesSelectedIndex(0);
            setCashflowUpdatesSubscribedItemId(null);
            setCashflowUpdatesSubscriptionResponse(null);
            setCashflowUpdatesManualPayload('');
            setCashflowUpdatesManualParseError(null);
            setCashflowUpdatesManualWebhooks([]);
            setWebhooks([]);

            setModalState('cashflow-updates-loading-items');
            setShowModal(true);

            const itemsResp = await fetch('/api/user-items-get', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(baseParams),
            });
            const itemsJson = await itemsResp.json();

            if (itemsResp.status >= 400) {
              setErrorData(itemsJson);
              setApiStatusCode(itemsResp.status);
              setModalState('api-error');
              setShowModal(true);
              return;
            }

            const rawItems: any[] = Array.isArray(itemsJson?.items) ? itemsJson.items : [];
            const normalized = rawItems
              .map((it: any) => {
                const item_id = String(it?.item_id || '').trim();
                const institution_name =
                  String(it?.institution_name || it?.institution_id || it?.item_id || '').trim() || 'Unknown institution';
                if (!item_id) return null;
                return { institution_name, item_id };
              })
              .filter(Boolean) as { institution_name: string; item_id: string }[];

            if (normalized.length === 0) {
              setErrorData({
                error: 'NO_ITEMS_FOUND',
                message:
                  'No Items were returned from /user/items/get. Ensure the sandbox item was created and the user has Items.',
                response: itemsJson,
              });
              setApiStatusCode(200);
              setModalState('api-error');
              setShowModal(true);
              return;
            }

            setCashflowUpdatesItems(normalized);
            setCashflowUpdatesSelectedIndex(0);
            setModalState('cashflow-updates-pick-item');
            setShowModal(true);
            return;
          }

          if (!productConfig.apiEndpoint) {
            throw new Error('Product API endpoint not configured');
          }

          // Build request body with user_id or user_token
          const baseParams: any = {};
          if (usedUserToken && userToken) {
            baseParams.user_token = userToken;
          } else if (userId) {
            baseParams.user_id = userId;
          } else if (userToken) {
            baseParams.user_token = userToken;
          }
          
          const requestBody = buildProductRequestBody(baseParams, productConfig);
          
          // Store the FULL config (with useAltCredentials) for the API call
          setProductApiConfig(requestBody);
          setModalState('preview-product-api');
        } catch (error) {
          console.error('Error building CRA product API config:', error);
          setErrorMessage('We encountered an issue preparing the API call. Please try again.');
          setModalState('error');
          
          // Reset after a delay
          setTimeout(() => {
            setShowModal(false);
            setProductData(null);
            setModalState('loading');
            setShowButton(true);
            setShowWelcome(false);
            setShowProductModal(true);
          }, 3000);
        }
        return;
      }

      // Non-CRA products: show processing modal for token exchange and accounts/get
      setModalState('processing-accounts');
      setShowModal(true);

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
      setAccessToken(access_token);

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
          return;
        }
        
        setAccountsData(accountsData);
        setApiStatusCode(accountsResponse.status);
        setModalState('accounts-data');
      } else {
        // For Signal Balance, skip accounts/get and go straight to processing product
        setModalState('processing-product');
        
        if (!productConfig || !productConfig.apiEndpoint) {
          throw new Error('Product API endpoint not configured');
        }

        // Build request body with access token and any additional params
        const requestBody = buildProductRequestBody(
          { access_token },
          productConfig
        );
        
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
      }
    } catch (error) {
      console.error('Error in bypass Link success flow:', error);
      setErrorMessage('We encountered an issue. Please try again.');
      setModalState('error');
    }
  };

  const onSuccess = useCallback((public_token: string, metadata: any) => {
    // Hide the button
    setShowButton(false);
    
    const effectiveProductId = effectiveProductIdRef.current;
    const productConfig = effectiveProductId ? getProductConfigById(effectiveProductId) : undefined;
    const isUpdateMode = effectiveProductId === 'link-update-mode';

    // Link-only: Update Mode should always show the standard callback modals (ignore Zap/Multi-item behavior)
    if (isUpdateMode) {
      setEventLogsPosition('left');
      setShowModal(true);
      setModalState('callback-success');
      setCallbackData({
        public_token,
        metadata,
      });
      setShowWebhookPanel(false);
      return;
    }

    // Multi-item Link: do not show onSuccess screen for non-CRA products (tokens come from LINK webhooks)
    const isMultiItemNonCra = multiItemLinkEnabled && !productConfig?.isCRA;
    if (isMultiItemNonCra) {
      setShowWebhookPanel(false);
      return;
    }

    // Layer: always show the standard callback-success modal (even if Zap is enabled)
    if (layerSessionActiveRef.current) {
      setEventLogsPosition('left');
      setShowModal(true);
      setModalState('callback-success');
      setCallbackData({
        public_token,
        metadata,
      });
      if (WEBHOOKS_ENABLED && webhookUrlRef.current && productConfig?.requiresWebhook) {
        setShowWebhookPanel(true);
      } else {
        setShowWebhookPanel(false);
      }
      return;
    }

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
      if (WEBHOOKS_ENABLED && webhookUrlRef.current && productConfig?.requiresWebhook) {
        setShowWebhookPanel(true);
      } else {
        setShowWebhookPanel(false);
      }
    }
  }, [multiItemLinkEnabled, zapMode, demoMode, handleZapModeSuccess]);

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
    setShowWebhookPanel(false);

    // Demo Mode bootstrap: no single product is selected yet; always exchange public_token and return to the demo menu.
    if (demoMode && !demoLinkCompleted) {
      try {
        const public_token = typeof callbackData?.public_token === 'string' ? callbackData.public_token : '';
        if (!public_token) {
          throw new Error('Missing public_token for token exchange');
        }

        setModalState('processing-accounts');
        setShowModal(true);

        const exchangeResponse = await fetch('/api/exchange-public-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token }),
        });
        const exchangeJson = await exchangeResponse.json();
        if (!exchangeResponse.ok) {
          setErrorData(exchangeJson);
          setApiStatusCode(exchangeResponse.status);
          setModalState('api-error');
          setShowModal(true);
          return;
        }

        const access_token: string = exchangeJson.access_token;
        accessTokenRef.current = access_token;
        setAccessToken(access_token);
        setDemoAccessToken(access_token);
        setDemoLinkCompleted(true);
        setShowModal(false);
        setShowProductModal(true);
        return;
      } catch (e: any) {
        setErrorData({
          error: 'DEMO_MODE_EXCHANGE_FAILED',
          message: e?.message || 'Failed to exchange public_token in Demo Mode.',
        });
        setApiStatusCode(500);
        setModalState('api-error');
        setShowModal(true);
        return;
      }
    }

    // Get the effective product ID to check product type
    const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
    const productConfig = getProductConfigById(effectiveProductId!);
    const callbackPublicToken: string | null =
      typeof callbackData?.public_token === 'string' ? callbackData.public_token : null;
    const isLayerProfileToken = !!callbackPublicToken && callbackPublicToken.startsWith('profile-');

    // Link-only: Update Mode does not run downstream APIs or cleanup; return to main menu.
    if (effectiveProductId === 'link-update-mode') {
      returnToProductMenuNoRemove();
      return;
    }

    // Link-only: Upgrade Mode behaves like CRA post-Link (wait for USER_CHECK_REPORT_READY, then call one CRA endpoint).
    if (effectiveProductId === 'link-upgrade-mode') {
      const expectedUserId = userId || null;
      const hasReadyWebhook = (webhooks || []).some((w: any) => {
        const webhookType = w.webhook_type ?? w.payload?.webhook_type;
        const webhookCode = w.webhook_code ?? w.payload?.webhook_code;
        if (webhookType !== 'CHECK_REPORT') return false;
        if (webhookCode !== 'USER_CHECK_REPORT_READY') return false;
        if (!expectedUserId) return true;
        const payloadUserId = w.payload?.user_id ?? w.payload?.user?.user_id ?? w.user_id;
        return !payloadUserId || payloadUserId === expectedUserId;
      });

      if (!hasReadyWebhook) {
        // Reuse hosted-waiting (dev: shows MultiItemWebhookPanel in check_report mode; prod: manual paste)
        setHostedWaitingMode('cra_check_report');
        setCraCheckReportExpectedUserId(expectedUserId);
        setCraCheckReportManualReady(false);
        setHostedLinkUrl(null);
        setHostedLinkManualPayload('');
        setHostedLinkManualParseError(null);
        setHostedLinkExtractedPublicTokens([]);
        setModalState('hosted-waiting');
        setShowModal(true);
        return;
      }

      handleUpgradeModeReportReadyForward();
      return;
    }
    
    // Check if this is a CRA product
    if (productConfig?.isCRA) {
      // CRA products: if hybrid is active, run exchange + sequential flow; otherwise keep existing CRA flow
      try {
        // Layer + CRA: after Layer completes, persist identity via /user/update, then create a report via /cra/check_report/create.
        if (layerMode && (layerSessionActive || isLayerProfileToken)) {
          if (useLegacyUserToken) {
            setErrorData({
              error: 'LAYER_CRA_LEGACY_UNSUPPORTED',
              message: 'Layer + CRA requires user_id. Disable legacy user_token to continue.',
            });
            setApiStatusCode(400);
            setModalState('api-error');
            setShowModal(true);
            return;
          }

          const public_token = callbackPublicToken;
          if (!public_token) {
            throw new Error('Missing public_token for Layer + CRA flow');
          }
          if (!userId) {
            throw new Error('Missing user_id for Layer + CRA flow');
          }
          if (!effectiveWebhookConfigUrl) {
            throw new Error('Missing webhook URL for CRA report creation');
          }

          // Step A: /user_account/session/get
          setModalState('layer-processing-session-get');
          setShowModal(true);

          const sessionResp = await fetch('/api/user-account-session-get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token }),
          });
          const sessionJson = await sessionResp.json();
          if (sessionResp.status >= 400) {
            setErrorData(sessionJson);
            setApiStatusCode(sessionResp.status);
            setModalState('api-error');
            setShowModal(true);
            return;
          }

          // Step B: /user/update (best-effort mapping from Layer identity)
          const layerIdentity = sessionJson?.identity || {};
          const nameObj = layerIdentity?.name || {};
          const given_name = String(nameObj?.given_name || nameObj?.first_name || nameObj?.given || '').trim();
          const family_name = String(nameObj?.family_name || nameObj?.last_name || nameObj?.family || '').trim();
          const date_of_birth = String(layerIdentity?.date_of_birth || layerIdentity?.dob || '').trim();

          const extractPrimaryEmail = (identity: any): string => {
            const candidates: any[] = [];

            const pushFromArray = (arr: any[]) => {
              for (const entry of arr) {
                if (!entry) continue;
                if (typeof entry === 'string') {
                  candidates.push(entry);
                  continue;
                }
                if (typeof entry === 'object') {
                  candidates.push(
                    entry.data,
                    entry.email,
                    entry.value,
                    entry.address,
                    entry.email_address,
                    entry.emailAddress
                  );
                }
              }
            };

            if (Array.isArray(identity?.emails)) pushFromArray(identity.emails);
            if (Array.isArray(identity?.email_addresses)) pushFromArray(identity.email_addresses);

            candidates.push(
              identity?.email,
              identity?.email_address,
              identity?.emailAddress,
              identity?.primary_email,
              identity?.contact?.email
            );

            for (const raw of candidates) {
              const v = String(raw || '').trim();
              if (!v) continue;
              return v;
            }
            return '';
          };

          const emailVal = extractPrimaryEmail(layerIdentity);
          const emailForUpdate = (emailVal || 'carmen@example.com').trim();
          const phoneVal =
            Array.isArray(layerIdentity?.phone_numbers) && layerIdentity.phone_numbers.length > 0
              ? String(layerIdentity.phone_numbers[0]?.data || layerIdentity.phone_numbers[0] || '').trim()
              : String(layerIdentity?.phone_number || '').trim();

          const addressCandidate =
            (Array.isArray(layerIdentity?.addresses) && layerIdentity.addresses.length > 0
              ? layerIdentity.addresses[0]
              : layerIdentity?.address) || {};

          const street_1 = String(addressCandidate?.street_1 || addressCandidate?.street || '').trim();
          const street_2 = String(addressCandidate?.street_2 || '').trim();
          const city = String(addressCandidate?.city || '').trim();
          const region = String(addressCandidate?.region || addressCandidate?.state || '').trim();
          const postal_code = String(addressCandidate?.postal_code || addressCandidate?.zip || '').trim();
          const country = String(addressCandidate?.country || '').trim();

          const addressBase: any = {
            ...(street_1 ? { street_1 } : {}),
            ...(street_2 ? { street_2 } : {}),
            ...(city ? { city } : {}),
            ...(region ? { region } : {}),
            ...(postal_code ? { postal_code } : {}),
            ...(country ? { country } : {}),
          };
          const address = Object.keys(addressBase).length > 0 ? { ...addressBase, primary: true } : null;

          const identityUpdate: any = {
            ...(given_name || family_name ? { name: { ...(given_name ? { given_name } : {}), ...(family_name ? { family_name } : {}) } } : {}),
            ...(date_of_birth ? { date_of_birth } : {}),
            emails: [{ data: emailForUpdate, primary: true }],
            ...(phoneVal ? { phone_numbers: [{ data: phoneVal, primary: true }] } : {}),
            ...(address ? { addresses: [address] } : {}),
          };

          const productsToCreate = Array.isArray(productConfig.products)
            ? productConfig.products.filter((p) => p !== 'cra_base_report')
            : [];

          const nextPayload = { user_id: userId, identity: identityUpdate };
          setUserUpdateConfig(nextPayload);
          setUserUpdateConfigError(null);
          setIsEditingUserUpdateConfig(false);
          setEditedUserUpdateConfig('');
          setCraLayerPendingAfterUserUpdate({
            userId,
            webhook: effectiveWebhookConfigUrl,
            productsToCreate,
          });
          setModalState('preview-user-update');
          setShowModal(true);
          return;
        }

        if (hybridModeActive) {
          const { public_token } = callbackData || {};

          if (!public_token) {
            throw new Error('Missing public_token for token exchange');
          }

          // Exchange public token for access token
          setModalState('processing-accounts');
          setShowModal(true);

          const exchangeResponse = await fetch('/api/exchange-public-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ public_token }),
          });

          const exchangeJson = await exchangeResponse.json();
          if (!exchangeResponse.ok) {
            setErrorData(exchangeJson);
            setApiStatusCode(exchangeResponse.status);
            setModalState('api-error');
            setShowModal(true);
            return;
          }

          const access_token: string = exchangeJson.access_token;
          accessTokenRef.current = access_token;
          setAccessToken(access_token);

          const steps = buildHybridQueue(linkTokenConfig);
          setHybridQueue(steps);
          setHybridStepIndex(0);

          // Execute first step (accounts/get)
          await executeHybridStep(0, access_token, steps);
          return;
        }

        // CRA Cashflow Updates: run the dedicated Monitoring Insights sequence
        if (effectiveProductId === 'cra-cashflow-updates') {
          const baseParams: any = {};
          if (usedUserToken && userToken) {
            baseParams.user_token = userToken;
          } else if (userId) {
            baseParams.user_id = userId;
          } else if (userToken) {
            baseParams.user_token = userToken;
          } else {
            throw new Error('Missing user_id/user_token for CRA flow');
          }

          // Reset per-run state so we only gate on fresh webhooks
          setCashflowUpdatesItems([]);
          setCashflowUpdatesSelectedIndex(0);
          setCashflowUpdatesSubscribedItemId(null);
          setCashflowUpdatesSubscriptionResponse(null);
          setCashflowUpdatesManualPayload('');
          setCashflowUpdatesManualParseError(null);
          setCashflowUpdatesManualWebhooks([]);
          setWebhooks([]);

          setModalState('cashflow-updates-loading-items');
          setShowModal(true);

          const itemsResp = await fetch('/api/user-items-get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(baseParams),
          });
          const itemsJson = await itemsResp.json();

          if (itemsResp.status >= 400) {
            setErrorData(itemsJson);
            setApiStatusCode(itemsResp.status);
            setModalState('api-error');
            setShowModal(true);
            return;
          }

          const rawItems: any[] = Array.isArray(itemsJson?.items) ? itemsJson.items : [];
          const normalized = rawItems
            .map((it: any) => {
              const item_id = String(it?.item_id || '').trim();
              const institution_name =
                String(it?.institution_name || it?.institution_id || it?.item_id || '').trim() || 'Unknown institution';
              if (!item_id) return null;
              return { institution_name, item_id };
            })
            .filter(Boolean) as { institution_name: string; item_id: string }[];

          if (normalized.length === 0) {
            setErrorData({
              error: 'NO_ITEMS_FOUND',
              message: 'No Items were returned from /user/items/get. Ensure Link completed and the user has Items.',
              response: itemsJson,
            });
            setApiStatusCode(200);
            setModalState('api-error');
            setShowModal(true);
            return;
          }

          setCashflowUpdatesItems(normalized);
          setCashflowUpdatesSelectedIndex(0);
          setModalState('cashflow-updates-pick-item');
          setShowModal(true);
          return;
        }

        if (!productConfig.apiEndpoint) {
          throw new Error('Product API endpoint not configured');
        }

        // Build request body with user_id or user_token
        // Use the same parameter that was used for Link Token creation
        const baseParams: any = {};
        if (usedUserToken && userToken) {
          baseParams.user_token = userToken;
        } else if (userId) {
          baseParams.user_id = userId;
        } else if (userToken) {
          baseParams.user_token = userToken;
        }
        
        const requestBody = buildProductRequestBody(baseParams, productConfig);
        
        // Store the config for the API call
        setProductApiConfig(requestBody);
        setModalState('preview-product-api');
        setShowModal(true);
      } catch (error) {
        console.error('Error building CRA product API config:', error);
        setErrorMessage('We encountered an issue preparing the API call. Please try again.');
        setModalState('error');
        setShowModal(true);
        
        // Reset after a delay
        setTimeout(() => {
          setShowModal(false);
          setCallbackData(null);
          setProductData(null);
          setModalState('loading');
          setShowButton(true);
          setShowWelcome(false);
          setShowProductModal(true);
        }, 3000);
      }
      return;
    }
    
    // Layer flow (non-CRA): get access_token + identity via /user_account/session/get
    if (layerMode && layerSessionActive) {
      try {
        const { public_token } = callbackData || {};
        if (!public_token) {
          throw new Error('Missing public_token for Layer flow');
        }

        setModalState('layer-processing-session-get');
        setShowModal(true);

        const sessionResp = await fetch('/api/user-account-session-get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token }),
        });
        const sessionJson = await sessionResp.json();
        if (sessionResp.status >= 400) {
          setErrorData(sessionJson);
          setApiStatusCode(sessionResp.status);
          setModalState('api-error');
          setShowModal(true);
          return;
        }

        const firstAccessToken =
          Array.isArray(sessionJson?.items) && sessionJson.items.length > 0
            ? sessionJson.items[0]?.access_token
            : null;

        let access_token: string | null = typeof firstAccessToken === 'string' ? firstAccessToken : null;

        // Fallback: if Layer didn't return an access_token, fall back to the normal public_token exchange.
        if (!access_token) {
          const exchangeResp = await fetch('/api/exchange-public-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token }),
          });
          const exchangeJson = await exchangeResp.json();
          if (exchangeResp.status >= 400) {
            setErrorData(exchangeJson);
            setApiStatusCode(exchangeResp.status);
            setModalState('api-error');
            setShowModal(true);
            return;
          }
          access_token = exchangeJson?.access_token || null;
        }

        if (!access_token) {
          setErrorData({
            error: 'LAYER_ACCESS_TOKEN_MISSING',
            message: 'Unable to determine access_token from Layer session.',
            session: sessionJson,
          });
          setApiStatusCode(500);
          setModalState('api-error');
          setShowModal(true);
          return;
        }

        // Optional: Layer Identity Match
        if (layerIdentityMatchEnabled) {
          setModalState('layer-processing-identity-match');
          setShowModal(true);

          const identity = sessionJson?.identity || {};
          const nameObj = identity?.name || {};
          const firstName = nameObj?.first_name || nameObj?.given_name || '';
          const lastName = nameObj?.last_name || nameObj?.family_name || '';
          const legal_name = `${firstName} ${lastName}`.trim() || undefined;

          const addressObj = identity?.address || {};
          const userForMatch: any = {
            ...(legal_name ? { legal_name } : {}),
            ...(identity?.phone_number ? { phone_number: identity.phone_number } : {}),
            ...(identity?.email ? { email_address: identity.email } : {}),
            ...(addressObj && Object.keys(addressObj).length > 0
              ? {
                  address: {
                    ...(addressObj.street ? { street: addressObj.street } : {}),
                    ...(addressObj.street2 ? { street2: addressObj.street2 } : {}),
                    ...(addressObj.city ? { city: addressObj.city } : {}),
                    ...(addressObj.region ? { region: addressObj.region } : {}),
                    ...(addressObj.postal_code ? { postal_code: addressObj.postal_code } : {}),
                    ...(addressObj.country ? { country: addressObj.country } : {}),
                  },
                }
              : {}),
          };

          const matchResp = await fetch('/api/identity-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token, user: userForMatch }),
          });
          const matchJson = await matchResp.json();
          if (matchResp.status >= 400) {
            setErrorData(matchJson);
            setApiStatusCode(matchResp.status);
            setModalState('api-error');
            setShowModal(true);
            return;
          }

          setLayerIdentityMatchData(matchJson);
          setAccessToken(access_token);
          setModalState('layer-identity-match-results');
          setShowModal(true);
          return;
        }

        // Continue into the standard non-CRA flow (accounts/get → product APIs)
        await runNonCraFlowWithAccessToken(access_token);
      } catch (e: any) {
        setErrorMessage(e?.message || 'Layer flow failed. Please try again.');
        setModalState('error');
        setShowModal(true);
      }
      return;
    }

    // Non-CRA products: proceed with normal flow
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
      accessTokenRef.current = access_token;
      setAccessToken(access_token);

      // If in Demo Mode, store access token and show product selector
      if (demoMode) {
        setDemoAccessToken(access_token);
        setDemoLinkCompleted(true);
        setShowModal(false);
        setShowProductModal(true);
        return;
      }

      const skipAccountsGet = effectiveProductId === 'signal-balance';

      if (skipAccountsGet) {
        // Skip accounts/get for Signal Balance and go directly to product API
        setModalState('processing-product');
        
        const productConfig = getProductConfigById(effectiveProductId!);
        
        if (!productConfig || !productConfig.apiEndpoint) {
          throw new Error('Product API endpoint not configured');
        }

        // Build request body with access token and any additional params
        const requestBody = buildProductRequestBody({ access_token }, productConfig);
        
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
    try {
      // Get the effective product ID (child if selected, otherwise parent)
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      
      if (!productConfig || !productConfig.apiEndpoint) {
        throw new Error('Product API endpoint not configured');
      }

      // Build request body with access token, accounts data, and any additional params
      const tokenToUse = accessTokenRef.current || accessToken;
      if (!tokenToUse) {
        throw new Error('Missing access_token for product API call');
      }
      const requestBody = buildProductRequestBody(
        { access_token: tokenToUse },
        productConfig,
        accountsData
      );
      
      // Store the config for the API call
      setProductApiConfig(requestBody);
      setModalState('preview-product-api');
    } catch (error) {
      console.error('Error building product API config:', error);
      setErrorMessage('We encountered an issue preparing the API call. Please try again.');
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
    setSelectedGrandchildProduct(null);
    
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

      // CRA products are user-based and may require waiting for USER_CHECK_REPORT_READY
      if (productConfig.isCRA) {
        const expectedUserId = userId || null;
        const hasReadyWebhook = (webhooks || []).some((w: any) => {
          const webhookType = w.webhook_type ?? w.payload?.webhook_type;
          const webhookCode = w.webhook_code ?? w.payload?.webhook_code;
          if (webhookType !== 'CHECK_REPORT') return false;
          if (webhookCode !== 'USER_CHECK_REPORT_READY') return false;
          if (!expectedUserId) return true;
          const payloadUserId = w.payload?.user_id ?? w.payload?.user?.user_id ?? w.user_id;
          return !payloadUserId || payloadUserId === expectedUserId;
        });

        if (!hasReadyWebhook) {
          // Reuse hosted-waiting (dev: shows MultiItemWebhookPanel in check_report mode; prod: manual paste)
          setHostedWaitingMode('cra_check_report');
          setCraCheckReportExpectedUserId(expectedUserId);
          setCraCheckReportManualReady(false);
          setHostedLinkUrl(null);
          setHostedLinkManualPayload('');
          setHostedLinkManualParseError(null);
          setHostedLinkExtractedPublicTokens([]);
          setModalState('hosted-waiting');
          setShowModal(true);
          return;
        }

        const baseParams: any = {};
        if (usedUserToken && userToken) {
          baseParams.user_token = userToken;
        } else if (userId) {
          baseParams.user_id = userId;
        } else if (userToken) {
          baseParams.user_token = userToken;
        } else {
          throw new Error('Missing user_id/user_token for CRA product call');
        }

        const requestBody = buildProductRequestBody(baseParams, productConfig);
        setProductApiConfig(requestBody);
        setModalState('preview-product-api');
        setShowModal(true);
        return;
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
      // Pass accountsData only if it was fetched (not for Signal Balance)
      const requestBody = buildProductRequestBody(
        { access_token: demoAccessToken }, 
        productConfig,
        skipAccountsGet ? undefined : accountsData
      );
      
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
    
    const effectiveProductId = effectiveProductIdRef.current;
    const isUpdateMode = effectiveProductId === 'link-update-mode';

    // Link-only: Update Mode should always show the standard callback modals (ignore Zap/Multi-item behavior)
    if (isUpdateMode) {
      if (!zapMode) {
        setEventLogsPosition('left');
      }
      setShowModal(true);
      setModalState('callback-exit');
      setCallbackData({
        err: err || null,
        metadata,
      });
      setShowWebhookPanel(false);
      return;
    }

    // Multi-item Link: for non-CRA products, do not show onExit screen; return to product selection
    const productConfig = effectiveProductId ? getProductConfigById(effectiveProductId) : undefined;
    const isMultiItemNonCra = multiItemLinkEnabled && !productConfig?.isCRA;
    if (isMultiItemNonCra) {
      setShowModal(false);
      setShowEventLogs(false);
      setEventLogsPosition('right');
      setIsTransitioningModals(false);
      setCallbackData(null);
      setModalState('loading');
      setShowButton(false);
      setShowWelcome(false);
      setShowWebhookPanel(false);
      setAccountsData(null);
      setProductData(null);
      setAccessToken(null);
      setMultiItemAccessTokens([]);
      setActiveMultiItemAccessTokenIndex(0);
      setLinkToken(null);
      setSelectedProduct(null);
      setSelectedChildProduct(null);
      setSelectedGrandchildProduct(null);
      setLinkEvents([]);
      setShowProductModal(true);
      return;
    }

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
    if (!zapMode && WEBHOOKS_ENABLED && webhookUrlRef.current && productConfig?.requiresWebhook) {
      setShowWebhookPanel(true);
    } else {
      setShowWebhookPanel(false);
    }
  }, [multiItemLinkEnabled, zapMode]);

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

    // Layer eligibility events (after submit)
    if (layerSessionActiveRef.current && modalStateRef.current === 'layer-waiting-eligibility') {
      if (eventName === 'LAYER_READY') {
        if (layerEligibilityBlockedRef.current) {
          return;
        }
        setShowEventLogs(true);
        setEventLogsPosition('right');
        const layerProductId = effectiveProductIdRef.current;
        const layerProductConfig = layerProductId ? getProductConfigById(layerProductId) : undefined;
        setShowWebhookPanel(WEBHOOKS_ENABLED && !!webhookUrlRef.current && !!layerProductConfig?.requiresWebhook);
        setShowModal(false);
        try {
          (openRef.current as any)?.();
        } catch {
          // ignore
        }
      } else if (eventName === 'LAYER_AUTOFILL_NOT_AVAILABLE') {
        // Extended Autofill failed after submitting date_of_birth; do not open Link.
        layerEligibilityBlockedRef.current = true;
        setShowEventLogs(false);
        setShowWebhookPanel(false);
        setErrorData({
          error: 'LAYER_AUTOFILL_NOT_AVAILABLE',
          message:
            'Extended Autofill is not available for this user/session. Please try again or return to the main menu.',
          metadata,
        });
        setApiStatusCode(400);
        setModalState('api-error');
        setShowModal(true);
      } else if (eventName === 'LAYER_NOT_AVAILABLE') {
        // Hide Layer panels and close any Plaid UI before prompting for DOB.
        try {
          (exitRef.current as any)?.();
        } catch {
          // ignore
        }
        setShowEventLogs(false);
        setShowWebhookPanel(false);
        layerEligibilityBlockedRef.current = true;
        // Prevent a near-simultaneous LAYER_READY from opening Link before React state updates.
        modalStateRef.current = 'layer-dob-submit';
        setModalState('layer-dob-submit');
        setShowModal(true);
      }
    }
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
    setShowWebhookPanel(false);
    setMultiItemAccessTokens([]);
    setActiveMultiItemAccessTokenIndex(0);
    setHybridModeActive(false);
    setHybridNonCraProducts([]);
    setHybridCraProducts([]);
    setHybridQueue([]);
    setHybridStepIndex(0);
    setHybridStepData(null);
    setHybridStepTitle('');
    setHybridStepStatusCode(200);
    // Clear link token and selected products to prevent auto-opening
    setLinkToken(null);
    setSelectedProduct(null);
    setSelectedChildProduct(null);
    setSelectedGrandchildProduct(null);
    setLinkEvents([]);
    setShowProductModal(true);

    // Reset Layer state
    setLayerSessionActive(false);
    setLayerPendingUserCreate(false);
    setLayerPendingProductId(null);
    setLayerPhoneSubmitConfig({ phone_number: DEFAULT_LAYER_PHONE_NUMBER });
    setIsEditingLayerPhoneSubmitConfig(false);
    setEditedLayerPhoneSubmitConfig(JSON.stringify({ phone_number: DEFAULT_LAYER_PHONE_NUMBER }, null, 2));
    setLayerPhoneSubmitConfigError(null);
    setLayerDateOfBirth(DEFAULT_LAYER_DATE_OF_BIRTH);
    setLayerDobSubmitConfig({ date_of_birth: DEFAULT_LAYER_DATE_OF_BIRTH });
    setIsEditingLayerDobSubmitConfig(false);
    setEditedLayerDobSubmitConfig(JSON.stringify({ date_of_birth: DEFAULT_LAYER_DATE_OF_BIRTH }, null, 2));
    setLayerDobSubmitConfigError(null);
    setLayerIdentityMatchData(null);

    // Reset embedded Link state
    setEmbeddedLinkActive(false);
    setEmbeddedInstitutionSelected(false);
    setEmbeddedLinkReady(false);
    if (embeddedLinkHandlerRef.current?.destroy) {
      embeddedLinkHandlerRef.current.destroy();
      embeddedLinkHandlerRef.current = null;
    }
  };

  const config = {
    token: linkToken,
    onSuccess,
    onExit,
    onEvent,
  };

  const { open, ready, submit, exit } = usePlaidLink(config as any);

  const modalStateRef = useRef(modalState);
  const layerSessionActiveRef = useRef(layerSessionActive);
  const readyRef = useRef(ready);
  const layerEligibilityBlockedRef = useRef(false);
  const openRef = useRef(open);
  const submitRef = useRef(submit);
  const exitRef = useRef(exit);

  // Track last user-visible (stable) modal state for API error "Back" fallback
  const lastStableModalStateRef = useRef<typeof modalState>('loading');
  const TRANSIENT_MODAL_STATES = new Set<typeof modalState>([
    'loading',
    'api-error',
    'processing-accounts',
    'processing-product',
    'processing-user-create',
    'creating-sandbox-item',
    'tidying-up',
    'layer-creating-session',
    'layer-processing-session-get',
    'layer-processing-user-update',
    'layer-processing-check-report-create',
    'layer-processing-identity-match',
    'hosted-waiting',
    'cashflow-updates-loading-items',
    'cashflow-updates-subscribing',
    'cashflow-updates-fetching-report',
  ]);
  useEffect(() => {
    if (!TRANSIENT_MODAL_STATES.has(modalState)) {
      lastStableModalStateRef.current = modalState;
    }
  }, [modalState]);

  useEffect(() => {
    modalStateRef.current = modalState;
  }, [modalState]);
  useEffect(() => {
    layerSessionActiveRef.current = layerSessionActive;
  }, [layerSessionActive]);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);
  useEffect(() => {
    exitRef.current = exit;
  }, [exit]);

  const handleLayerSubmitPhone = useCallback(() => {
    if (!readyRef.current) return;
    const fn = submitRef.current as any;
    if (!fn) return;
    try {
      const phone_number = String(layerPhoneSubmitConfig?.phone_number || '').trim();
      if (!phone_number) return;
      fn({ phone_number });
    } catch (e: any) {
      setErrorData({
        error: 'LAYER_SUBMIT_FAILED',
        message: e?.message || 'Failed to submit phone_number. Please try again.',
      });
      setApiStatusCode(500);
      setModalState('api-error');
      setShowModal(true);
      return;
    }
    layerEligibilityBlockedRef.current = false;
    modalStateRef.current = 'layer-waiting-eligibility';
    // No need for an intermediate "waiting" modal — Layer generally opens immediately.
    setShowModal(false);
  }, [layerPhoneSubmitConfig]);

  const handleLayerSubmitDob = useCallback(() => {
    if (!readyRef.current) return;
    const fn = submitRef.current as any;
    if (!fn) return;
    try {
      const date_of_birth = String(layerDobSubmitConfig?.date_of_birth || '').trim();
      if (!date_of_birth) return;
      fn({ date_of_birth });
    } catch (e: any) {
      setErrorData({
        error: 'LAYER_SUBMIT_FAILED',
        message: e?.message || 'Failed to submit date_of_birth. Please try again.',
      });
      setApiStatusCode(500);
      setModalState('api-error');
      setShowModal(true);
      return;
    }
    layerEligibilityBlockedRef.current = false;
    modalStateRef.current = 'layer-waiting-eligibility';
    // No need for an intermediate "waiting" modal — Layer generally opens immediately.
    setShowModal(false);
  }, [layerDobSubmitConfig]);

  const handleProceedAfterLayerIdentityMatch = useCallback(async () => {
    if (!accessToken) return;
    setLayerIdentityMatchData(null);
    await runNonCraFlowWithAccessToken(accessToken);
  }, [accessToken, runNonCraFlowWithAccessToken]);

  // Open embedded Link - just shows the container, the useEffect below handles initialization
  const openEmbeddedLink = useCallback(() => {
    if (!linkToken) return;
    // Show the embedded container - the useEffect will handle initialization
    setEmbeddedLinkActive(true);
  }, [linkToken]);

  // Initialize embedded Link when container becomes available
  useEffect(() => {
    if (!embeddedLinkActive || !linkToken) return;
    
    // Don't reinitialize if already initialized
    if (embeddedLinkHandlerRef.current) return;

    // Wait for next frame to ensure DOM is updated and ref is populated
    const timeoutId = setTimeout(() => {
      console.log('[Embedded] Attempting to initialize...');
      
      if (!embeddedContainerRef.current) {
        console.error('[Embedded] Container ref not available');
        return;
      }
      console.log('[Embedded] Container ref available:', embeddedContainerRef.current);

      const Plaid = (window as any).Plaid;
      console.log('[Embedded] Plaid SDK:', Plaid);
      console.log('[Embedded] Plaid.createEmbedded:', Plaid?.createEmbedded);
      
      if (!Plaid || !Plaid.createEmbedded) {
        console.error('[Embedded] Plaid.createEmbedded is not available');
        return;
      }

      console.log('[Embedded] Calling Plaid.createEmbedded with token:', linkToken?.substring(0, 20) + '...');
      
      embeddedLinkHandlerRef.current = Plaid.createEmbedded({
        token: linkToken,
        onSuccess: (public_token: string, metadata: any) => {
          console.log('[Embedded] onSuccess fired');
          // Clean up and hide container
          setEmbeddedLinkActive(false);
          setEmbeddedInstitutionSelected(false);
          setEmbeddedLinkReady(false);
          if (embeddedLinkHandlerRef.current?.destroy) {
            embeddedLinkHandlerRef.current.destroy();
            embeddedLinkHandlerRef.current = null;
          }
          onSuccess(public_token, metadata);
        },
        onExit: (err: any, metadata: any) => {
          console.log('[Embedded] onExit fired', err);
          // Clean up and hide container
          setEmbeddedLinkActive(false);
          setEmbeddedInstitutionSelected(false);
          setEmbeddedLinkReady(false);
          if (embeddedLinkHandlerRef.current?.destroy) {
            embeddedLinkHandlerRef.current.destroy();
            embeddedLinkHandlerRef.current = null;
          }
          onExit(err, metadata);
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log('[Embedded] onEvent fired:', eventName, metadata);
          // When institution is selected, hide overlay and let Link continue
          if (eventName === 'SELECT_INSTITUTION') {
            setEmbeddedInstitutionSelected(true);
          }
          onEvent(eventName, metadata);
        },
      }, embeddedContainerRef.current);
      
      console.log('[Embedded] createEmbedded returned:', embeddedLinkHandlerRef.current);
      
      // Wait for the Plaid Link iframe to load before showing the container
      if (embeddedLinkHandlerRef.current && embeddedContainerRef.current) {
        const checkForIframe = () => {
          const iframe = embeddedContainerRef.current?.querySelector('iframe[title="Plaid Link"]');
          if (iframe) {
            console.log('[Embedded] Found iframe, waiting for load...');
            iframe.addEventListener('load', () => {
              console.log('[Embedded] Iframe loaded, showing container');
              setEmbeddedLinkReady(true);
            }, { once: true });
            // Fallback in case load already fired
            if ((iframe as HTMLIFrameElement).contentDocument?.readyState === 'complete') {
              console.log('[Embedded] Iframe already loaded');
              setEmbeddedLinkReady(true);
            }
          } else {
            // Iframe not found yet, check again
            setTimeout(checkForIframe, 50);
          }
        };
        checkForIframe();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [embeddedLinkActive, linkToken, onSuccess, onExit, onEvent]);

  // Auto-open Link when ready after product selection
  useEffect(() => {
    // In Demo Mode, we can open Link without a selected product
    // In normal mode, we need a selected product
    // Layer sessions manage opening Link via LAYER_READY (never auto-open here).
    const shouldOpenLink = ready && linkToken && !layerSessionActive && !hostedLinkActive && !hostedLinkEnabled && !showModal && !showChildModal && !showGrandchildModal && !showProductModal && !showZapResetButton && !embeddedLinkActive &&
      (demoMode || selectedProduct || selectedChildProduct || selectedGrandchildProduct);
    
    if (shouldOpenLink) {
      // Clear previous events and show event logs (unless in Zap Mode)
      setLinkEvents([]);
      if (!zapMode) {
        setShowEventLogs(true);
      }
      setShowProductModal(false); // Ensure product modal is hidden
      
      if (embeddedMode) {
        // Use embedded Link
        openEmbeddedLink();
      } else {
        // Use regular Link
        open();
      }
    }
  }, [ready, linkToken, layerSessionActive, selectedProduct, selectedChildProduct, selectedGrandchildProduct, showModal, showChildModal, showGrandchildModal, showProductModal, showZapResetButton, zapMode, demoMode, embeddedMode, embeddedLinkActive, open, openEmbeddedLink]);

  const handleButtonClick = () => {
    // Show product selection modal instead of opening Link directly
    setShowButton(false);
    setShowProductModal(true);
  };

  const handleDemoModeStart = async () => {
    const enabledProductIds = Object.keys(demoProductsVisibility).filter(
      (id) => demoProductsVisibility[id] && id !== 'link' && !id.startsWith('link-')
    );

    const collectLeafConfigs = (cfg: ProductConfig): ProductConfig[] => {
      if (!cfg.children || cfg.children.length === 0) {
        return [cfg];
      }
      return cfg.children.flatMap(collectLeafConfigs);
    };

    const hasAnyEnabledDescendant = (cfg: ProductConfig): boolean => {
      if (!cfg.children || cfg.children.length === 0) return false;
      for (const child of cfg.children) {
        if (demoProductsVisibility[child.id]) return true;
        if (hasAnyEnabledDescendant(child)) return true;
      }
      return false;
    };

    // Expand selected IDs into leaf configs (parents → descendants, children-with-grandchildren → grandchildren, etc.)
    const leafConfigsById = new Map<string, ProductConfig>();
    for (const id of enabledProductIds) {
      const cfg = getProductConfigById(id);
      if (!cfg) continue;
      // If a parent was auto-selected due to selecting a descendant, treat it as UI-only and
      // do not expand it into "select all leaves".
      if (cfg.children && cfg.children.length > 0 && hasAnyEnabledDescendant(cfg)) {
        continue;
      }
      for (const leaf of collectLeafConfigs(cfg)) {
        // Ignore Link pseudo-products in Demo Mode defensively
        if (leaf.id === 'link' || leaf.id.startsWith('link-')) continue;
        leafConfigsById.set(leaf.id, leaf);
      }
    }
    const selectedLeafConfigs = Array.from(leafConfigsById.values());

    // Build products[] for /link/token/create from all enabled leaf configs
    const productsSet = new Set<string>();
    let mergedAdditionalLinkParams: Record<string, any> = {};
    for (const leaf of selectedLeafConfigs) {
      for (const p of Array.isArray(leaf.products) ? leaf.products : []) {
        if (typeof p === 'string' && p) productsSet.add(p);
      }
      for (const p of Array.isArray(leaf.required_if_supported) ? leaf.required_if_supported : []) {
        if (typeof p === 'string' && p) productsSet.add(p);
      }
      if (leaf.additionalLinkParams && typeof leaf.additionalLinkParams === 'object') {
        mergedAdditionalLinkParams = { ...mergedAdditionalLinkParams, ...leaf.additionalLinkParams };
      }
    }
    const products = Array.from(productsSet);
    const includesCra = products.some((p) => p.startsWith('cra_')) || selectedLeafConfigs.some((c) => !!c.isCRA);

    // CRA in Demo Mode requires a webhook URL (so we can wait for readiness later)
    if (includesCra && !effectiveWebhookConfigUrl) {
      setErrorData({
        error: 'WEBHOOK_URL_REQUIRED',
        message: 'Configure a webhook URL in Settings before starting Demo Mode with CRA products.',
      });
      setApiStatusCode(400);
      setModalState('api-error');
      setShowModal(true);
      setShowWelcome(false);
      return;
    }

    const demoConfig: any = {
      link_customization_name: 'flash',
      user: includePhoneNumber
        ? { client_user_id: generateClientUserId(), phone_number: '+14155550011' }
        : { client_user_id: generateClientUserId() },
      client_name: 'Plaid Flash',
      products,
      country_codes: ['US'],
      language: 'en'
    };

    // Only include transactions config when transactions is selected
    if (productsSet.has('transactions')) {
      demoConfig.transactions = { days_requested: 14 };
    }

    // Merge any per-product additional link params (e.g., CRA permissible purpose)
    Object.assign(demoConfig, mergedAdditionalLinkParams);

    // Add webhook if needed (CRA, Hosted Link, or Multi-item Link)
    if (effectiveWebhookConfigUrl && (includesCra || hostedLinkEnabled || multiItemLinkEnabled)) {
      demoConfig.webhook = effectiveWebhookConfigUrl;
    }

    if (hostedLinkEnabled) {
      demoConfig.hosted_link = {};
    }

    if (multiItemLinkEnabled) {
      demoConfig.enable_multi_item_link = true;
    }
    
    // Set flag that we're starting demo mode
    setIsDemoModeStarting(true);

    if (includesCra) {
      // CRA requires /user/create first so we can include user_id/user_token in /link/token/create
      const craLeaf = selectedLeafConfigs.find((c) => c.isCRA);
      const craProductIdForUserCreate = craLeaf?.id || 'cra-base-report';
      setDemoPendingLinkTokenConfig(demoConfig);
      showUserCreatePreview(craProductIdForUserCreate);
      return;
    }

    // Non-CRA demo: show /link/token/create preview directly
    setDemoPendingLinkTokenConfig(null);
    setLinkTokenConfig(demoConfig);
    setModalState('preview-config');
    setShowModal(true);
  };

  const handleStartOver = async () => {
    // Hide product selector modals first
    setShowProductModal(false);
    setShowChildModal(false);
    setShowGrandchildModal(false);

    // Reset Hosted Link waiting UI
    setHostedLinkActive(false);
    setHostedLinkUrl(null);
    setHostedLinkManualPayload('');
    setHostedLinkManualParseError(null);
    setHostedLinkExtractedPublicTokens([]);
    setHostedWaitingMode('hosted_link');
    setCraCheckReportExpectedUserId(null);
    setCraCheckReportManualReady(false);

    // Reset Cashflow Updates state
    setCashflowUpdatesItems([]);
    setCashflowUpdatesSelectedIndex(0);
    setCashflowUpdatesSubscribedItemId(null);
    setCashflowUpdatesSubscriptionResponse(null);
    setCashflowUpdatesManualPayload('');
    setCashflowUpdatesManualParseError(null);
    setCashflowUpdatesManualWebhooks([]);
    
    const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
    const productConfig = effectiveProductId ? getProductConfigById(effectiveProductId) : undefined;
    const shouldRemoveBothForHybrid = hybridModeActive;
    const isUpgradeMode = effectiveProductId === 'link-upgrade-mode';

    // If auto-remove is disabled, bypass deletion and return to main menu
    if (!autoRemoveEnabled) {
      // Reset to product selection screen without reloading
      setShowModal(false);
      setAccountsData(null);
      setProductData(null);
      setCallbackData(null);
      setAccessToken(null);
      setMultiItemAccessTokens([]);
      setActiveMultiItemAccessTokenIndex(0);
      setHybridModeActive(false);
      setHybridNonCraProducts([]);
      setHybridCraProducts([]);
      setHybridQueue([]);
      setHybridStepIndex(0);
      setHybridStepData(null);
      setHybridStepTitle('');
      setHybridStepStatusCode(200);
      setSelectedProduct(null);
      setSelectedChildProduct(null);
      setSelectedGrandchildProduct(null);
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

      // Reset CRA state
      setUserCreateConfig(null);
      setUserId(null);
      setUserToken(null);
      setIsEditingUserCreateConfig(false);
      setEditedUserCreateConfig('');
      setUserCreateConfigError(null);

      // Reset webhook panel (but keep SSE connection open)
      setShowWebhookPanel(false);
      setWebhooks([]);

      // Reset embedded Link state
      setEmbeddedLinkActive(false);
      setEmbeddedInstitutionSelected(false);
      setEmbeddedLinkReady(false);
      if (embeddedLinkHandlerRef.current?.destroy) {
        embeddedLinkHandlerRef.current.destroy();
        embeddedLinkHandlerRef.current = null;
      }
      return;
    }

    // Clean up Plaid user/item
    const tokenToRemove = accessToken || demoAccessToken;
    const hasItemToRemove = !!tokenToRemove;
    const hasUserToRemove = !!(userId || userToken);

    if (
      (shouldRemoveBothForHybrid && (hasItemToRemove || hasUserToRemove)) ||
      (!shouldRemoveBothForHybrid && (productConfig?.isCRA || isUpgradeMode) && hasUserToRemove) ||
      (!shouldRemoveBothForHybrid && !productConfig?.isCRA && hasItemToRemove)
    ) {
      // Show tidying up message
      setModalState('tidying-up');
      setShowModal(true);
      
      try {
        if (shouldRemoveBothForHybrid) {
          if (hasItemToRemove) {
            await fetch('/api/item-remove', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: tokenToRemove }),
            });
          }
          if (hasUserToRemove) {
            await fetch('/api/user-remove', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, user_token: userToken }),
            });
          }
        } else if (productConfig?.isCRA || isUpgradeMode) {
          await fetch('/api/user-remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, user_token: userToken }),
          });
        } else {
          await fetch('/api/item-remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: tokenToRemove }),
          });
        }
      } catch (error) {
        console.error('Error tidying up:', error);
        // Continue with reset even if cleanup fails
      }
    }

    // Reset to product selection screen without reloading
    setShowModal(false);
    setAccountsData(null);
    setProductData(null);
    setCallbackData(null);
    setAccessToken(null);
    setMultiItemAccessTokens([]);
    setActiveMultiItemAccessTokenIndex(0);
    setHybridModeActive(false);
    setHybridNonCraProducts([]);
    setHybridCraProducts([]);
    setHybridQueue([]);
    setHybridStepIndex(0);
    setHybridStepData(null);
    setHybridStepTitle('');
    setHybridStepStatusCode(200);
    setSelectedProduct(null);
    setSelectedChildProduct(null);
    setSelectedGrandchildProduct(null);
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
    
    // Reset CRA state
    setUserCreateConfig(null);
    setUserId(null);
    setUserToken(null);
    setIsEditingUserCreateConfig(false);
    setEditedUserCreateConfig('');
    setUserCreateConfigError(null);
    
    // Reset webhook panel (but keep SSE connection open)
    setShowWebhookPanel(false);
    setWebhooks([]);

    // Reset embedded Link state
    setEmbeddedLinkActive(false);
    setEmbeddedInstitutionSelected(false);
    setEmbeddedLinkReady(false);
    if (embeddedLinkHandlerRef.current?.destroy) {
      embeddedLinkHandlerRef.current.destroy();
      embeddedLinkHandlerRef.current = null;
    }
  };

  const returnToProductMenuNoRemove = () => {
    // Reset to product selection screen without reloading, skipping any user/item removal.
    setShowModal(false);
    setAccountsData(null);
    setProductData(null);
    setCallbackData(null);
    setAccessToken(null);
    setMultiItemAccessTokens([]);
    setActiveMultiItemAccessTokenIndex(0);
    setHybridModeActive(false);
    setHybridNonCraProducts([]);
    setHybridCraProducts([]);
    setHybridQueue([]);
    setHybridStepIndex(0);
    setHybridStepData(null);
    setHybridStepTitle('');
    setHybridStepStatusCode(200);
    setSelectedProduct(null);
    setSelectedChildProduct(null);
    setSelectedGrandchildProduct(null);
    setLinkToken(null);
    setLinkEvents([]);
    setShowEventLogs(false);
    setEventLogsPosition('right');
    setIsTransitioningModals(false);
    setModalState('loading');
    setShowButton(false);
    setShowWelcome(false);
    setShowProductModal(true);
    setErrorData(null);
    setErrorMessage('');

    // Reset Hosted Link waiting UI
    setHostedLinkActive(false);
    setHostedLinkUrl(null);
    setHostedLinkManualPayload('');
    setHostedLinkManualParseError(null);
    setHostedLinkExtractedPublicTokens([]);
    try {
      hostedLinkPopupRef.current?.close();
    } catch {
      // ignore
    }
    hostedLinkPopupRef.current = null;

    // Reset Cashflow Updates state
    setCashflowUpdatesItems([]);
    setCashflowUpdatesSelectedIndex(0);
    setCashflowUpdatesSubscribedItemId(null);
    setCashflowUpdatesSubscriptionResponse(null);
    setCashflowUpdatesManualPayload('');
    setCashflowUpdatesManualParseError(null);
    setCashflowUpdatesManualWebhooks([]);

    // Reset CRA state
    setUserCreateConfig(null);
    setUserId(null);
    setUserToken(null);
    setIsEditingUserCreateConfig(false);
    setEditedUserCreateConfig('');
    setUserCreateConfigError(null);
    setUserUpdateConfig(null);
    setIsEditingUserUpdateConfig(false);
    setEditedUserUpdateConfig('');
    setUserUpdateConfigError(null);
    setCraLayerPendingAfterUserUpdate(null);

    // Reset Update Mode state
    setUpdateModeAccessTokenInput('');

    // Reset Layer state
    setLayerSessionActive(false);
    setLayerPendingUserCreate(false);
    setLayerPendingProductId(null);
    setLayerDateOfBirth(DEFAULT_LAYER_DATE_OF_BIRTH);
    setLayerIdentityMatchData(null);

    // Reset webhook panel (but keep SSE connection open)
    setShowWebhookPanel(false);
    setWebhooks([]);

    // Reset embedded Link state
    setEmbeddedLinkActive(false);
    setEmbeddedInstitutionSelected(false);
    setEmbeddedLinkReady(false);
    if (embeddedLinkHandlerRef.current?.destroy) {
      embeddedLinkHandlerRef.current.destroy();
      embeddedLinkHandlerRef.current = null;
    }
  };

  const handleZapReset = async () => {
    // Zap Mode reset: clean up and return to product selection
    const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
    const productConfig = effectiveProductId ? getProductConfigById(effectiveProductId) : undefined;
    const shouldRemoveBothForHybrid = hybridModeActive;
    const isUpgradeMode = effectiveProductId === 'link-upgrade-mode';

    // Reset Hosted Link waiting UI
    setHostedLinkActive(false);
    setHostedLinkUrl(null);
    setHostedLinkManualPayload('');
    setHostedLinkManualParseError(null);
    setHostedLinkExtractedPublicTokens([]);

    if (!autoRemoveEnabled) {
      // Skip deletion entirely and just reset UI
      // Reset to product selection
      setShowModal(false);
      setAccountsData(null);
      setProductData(null);
      setCallbackData(null);
      setAccessToken(null);
      setMultiItemAccessTokens([]);
      setActiveMultiItemAccessTokenIndex(0);
      setHybridModeActive(false);
      setHybridNonCraProducts([]);
      setHybridCraProducts([]);
      setHybridQueue([]);
      setHybridStepIndex(0);
      setHybridStepData(null);
      setHybridStepTitle('');
      setHybridStepStatusCode(200);
      setSelectedProduct(null);
      setSelectedChildProduct(null);
      setSelectedGrandchildProduct(null);
      setLinkToken(null);
      setLinkEvents([]);
      setShowEventLogs(false);
      setShowZapResetButton(false);
      setModalState('loading');
      setShowButton(false);
      setShowWelcome(false);
      setShowProductModal(true);

      // Reset embedded Link state
      setEmbeddedLinkActive(false);
      setEmbeddedInstitutionSelected(false);
      setEmbeddedLinkReady(false);
      if (embeddedLinkHandlerRef.current?.destroy) {
        embeddedLinkHandlerRef.current.destroy();
        embeddedLinkHandlerRef.current = null;
      }
      return;
    }

    const hasItemToRemove = !!accessToken;
    const hasUserToRemove = !!(userId || userToken);

    if (
      (shouldRemoveBothForHybrid && (hasItemToRemove || hasUserToRemove)) ||
      (!shouldRemoveBothForHybrid && (productConfig?.isCRA || isUpgradeMode) && hasUserToRemove) ||
      (!shouldRemoveBothForHybrid && !productConfig?.isCRA && hasItemToRemove)
    ) {
      // Show tidying up message
      setModalState('tidying-up');
      setShowModal(true);
      setShowZapResetButton(false);
      
      try {
        if (shouldRemoveBothForHybrid) {
          if (hasItemToRemove) {
            await fetch('/api/item-remove', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: accessToken }),
            });
          }
          if (hasUserToRemove) {
            await fetch('/api/user-remove', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, user_token: userToken }),
            });
          }
        } else if (productConfig?.isCRA || isUpgradeMode) {
          await fetch('/api/user-remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, user_token: userToken }),
          });
        } else {
          await fetch('/api/item-remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken }),
          });
        }
      } catch (error) {
        console.error('Error tidying up:', error);
      }
    }

    // Reset to product selection
    setShowModal(false);
    setAccountsData(null);
    setProductData(null);
    setCallbackData(null);
    setAccessToken(null);
    setMultiItemAccessTokens([]);
    setActiveMultiItemAccessTokenIndex(0);
    setHybridModeActive(false);
    setHybridNonCraProducts([]);
    setHybridCraProducts([]);
    setHybridQueue([]);
    setHybridStepIndex(0);
    setHybridStepData(null);
    setHybridStepTitle('');
    setHybridStepStatusCode(200);
    setSelectedProduct(null);
    setSelectedChildProduct(null);
    setSelectedGrandchildProduct(null);
    setLinkToken(null);
    setLinkEvents([]);
    setShowEventLogs(false);
    setShowZapResetButton(false);
    setModalState('loading');
    setShowButton(false);
    setShowWelcome(false);
    setShowProductModal(true);

    // Reset embedded Link state
    setEmbeddedLinkActive(false);
    setEmbeddedInstitutionSelected(false);
    setEmbeddedLinkReady(false);
    if (embeddedLinkHandlerRef.current?.destroy) {
      embeddedLinkHandlerRef.current.destroy();
      embeddedLinkHandlerRef.current = null;
    }
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

  const exchangePublicTokensAndProceed = async (publicTokens: string[]) => {
    try {
      if (!publicTokens || publicTokens.length === 0) {
        throw new Error('No public_tokens found to exchange');
      }

      // Hide onEvent + webhook viewers and show processing state
      setShowEventLogs(false);
      setShowWebhookPanel(false);
      setModalState('processing-accounts');
      setShowModal(true);

      const tokenInfos = await Promise.all(
        publicTokens.map(async (public_token) => {
          const exchangeResponse = await fetch('/api/exchange-public-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token }),
          });

          const exchangeData = await exchangeResponse.json();
          if (!exchangeResponse.ok) {
            throw exchangeData;
          }

          const access_token: string = exchangeData.access_token;

          // Enrich with institution info (best-effort)
          let item_id: string | null = null;
          let institution_id: string | null = null;
          let institution_name: string | null = null;

          try {
            const itemResponse = await fetch('/api/item-get', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token }),
            });
            const itemData = await itemResponse.json();
            if (itemResponse.ok) {
              item_id = itemData.item_id ?? null;
              institution_id = itemData.institution_id ?? null;
            }

            if (institution_id) {
              const instResponse = await fetch('/api/institutions-get-by-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  institution_id,
                  country_codes: ['US'],
                }),
              });
              const instData = await instResponse.json();
              if (instResponse.ok) {
                institution_name = instData.institution_name ?? instData.institution?.name ?? null;
              }
            }
          } catch (e) {
            // Best-effort enrichment only
          }

          return { access_token, item_id, institution_id, institution_name } satisfies MultiItemAccessTokenInfo;
        })
      );

      setMultiItemAccessTokens(tokenInfos);
      setActiveMultiItemAccessTokenIndex(0);

      // Default to the first access token downstream
      const activeAccessToken = tokenInfos[0]?.access_token;
      if (!activeAccessToken) {
        throw new Error('No access_token returned from exchange');
      }
      setAccessToken(activeAccessToken);

      // Continue with existing downstream flow (accounts/get -> product flow)
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      if (!productConfig) {
        throw new Error('Product configuration not found');
      }

      // CRA products still use user_id/user_token downstream
      if (productConfig.isCRA) {
        const baseParams: any = {};
        if (usedUserToken && userToken) {
          baseParams.user_token = userToken;
        } else if (userId) {
          baseParams.user_id = userId;
        } else if (userToken) {
          baseParams.user_token = userToken;
        }

        const requestBody = buildProductRequestBody(baseParams, productConfig);
        setProductApiConfig(requestBody);
        setModalState('preview-product-api');
        return;
      }

      const skipAccountsGet = effectiveProductId === 'signal-balance';
      if (!skipAccountsGet) {
        const accountsResponse = await fetch('/api/accounts-get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: activeAccessToken }),
        });
        const accountsJson = await accountsResponse.json();
        if (accountsResponse.status >= 400) {
          setErrorData(accountsJson);
          setApiStatusCode(accountsResponse.status);
          setModalState('api-error');
          return;
        }
        setAccountsData(accountsJson);
        setApiStatusCode(accountsResponse.status);
        setModalState('accounts-data');
      } else {
        // For Signal Balance, skip accounts/get and go straight to product API call
        setModalState('processing-product');

        if (!productConfig.apiEndpoint) {
          throw new Error('Product API endpoint not configured');
        }

        const requestBody = buildProductRequestBody(
          { access_token: activeAccessToken },
          productConfig
        );

        const productResponse = await fetch(productConfig.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        const productJson = await productResponse.json();
        if (productResponse.status >= 400) {
          setErrorData(productJson);
          setApiStatusCode(productResponse.status);
          setModalState('api-error');
          return;
        }
        setProductData(productJson);
        setApiStatusCode(productResponse.status);
        setModalState('success');
      }
    } catch (error: any) {
      console.error('[Token Exchange] Error processing Forward:', error);
      setErrorMessage('We encountered an issue. Please try again.');
      setModalState('error');
      setShowModal(true);
    }
  };

  const handleMultiItemForward = async (publicTokens: string[]) => {
    if (!isMultiItemFlowActive) return;
    await exchangePublicTokensAndProceed(publicTokens);
  };

  const pickNonCraLeafConfigsForHybrid = (config: any, nonCraProductStrings: string[]) => {
    const picked: ProductConfig[] = [];
    const seen = new Set<string>();

    const idToCfg = new Map<string, ProductConfig>();
    leafProductConfigs.forEach((c) => idToCfg.set(c.id, c));

    const isTransactionsSync = !!config?.transactions?.days_requested;

    for (const p of nonCraProductStrings) {
      let cfg: ProductConfig | undefined;

      if (p === 'transactions') {
        cfg = idToCfg.get(isTransactionsSync ? 'transactions-sync' : 'transactions-get');
      } else {
        cfg = leafProductConfigs.find((c) => !c.isCRA && c.products.includes(p));
      }

      if (cfg?.apiEndpoint && !seen.has(cfg.apiEndpoint)) {
        seen.add(cfg.apiEndpoint);
        picked.push(cfg);
      }
    }

    return picked;
  };

  const pickCraLeafConfigsForHybrid = (craProductStrings: string[]) => {
    const craSet = new Set(craProductStrings);
    const candidates = leafProductConfigs.filter(
      (c) => !!c.isCRA && c.products.length > 0 && c.products.every((p) => craSet.has(p))
    );

    // Remove less-specific subsets (e.g. base report if income insights is present)
    const filtered = candidates.filter((cfg) => {
      return !candidates.some((other) => {
        if (other === cfg) return false;
        if (other.products.length <= cfg.products.length) return false;
        return cfg.products.every((p) => other.products.includes(p));
      });
    });

    // Preserve stable traversal order based on leafProductConfigs
    const filteredSet = new Set(filtered.map((c) => c.id));
    return leafProductConfigs.filter((c) => filteredSet.has(c.id));
  };

  const buildHybridQueue = (config: any) => {
    const nonCraCfgs = pickNonCraLeafConfigsForHybrid(config, hybridNonCraProducts);
    const craCfgs = pickCraLeafConfigsForHybrid(hybridCraProducts);

    const steps: HybridStep[] = [{ kind: 'accounts', title: '/accounts/get Response' }];

    nonCraCfgs.forEach((cfg) => {
      steps.push({
        kind: 'product',
        title: `${cfg.apiTitle || cfg.name} Response`,
        productId: cfg.id,
        apiEndpoint: cfg.apiEndpoint!,
        isCRA: false,
      });
    });

    craCfgs.forEach((cfg) => {
      steps.push({
        kind: 'product',
        title: `${cfg.apiTitle || cfg.name} Response`,
        productId: cfg.id,
        apiEndpoint: cfg.apiEndpoint!,
        isCRA: true,
      });
    });

    return steps;
  };

  const executeHybridStep = async (
    index: number,
    accessTokenOverride?: string,
    queueOverride?: HybridStep[]
  ) => {
    const queueToUse = queueOverride || hybridQueue;
    const step = queueToUse[index];
    if (!step) return;

    const tokenToUse = accessTokenOverride || accessTokenRef.current || accessToken;

    try {
      if (step.kind === 'accounts') {
        setHybridStepTitle(step.title);
        setModalState('processing-accounts');
        setShowModal(true);

        if (!tokenToUse) {
          throw new Error('No access_token available for accounts/get');
        }

        const accountsResponse = await fetch('/api/accounts-get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenToUse }),
        });
        const accountsJson = await accountsResponse.json();
        if (accountsResponse.status >= 400) {
          setErrorData(accountsJson);
          setApiStatusCode(accountsResponse.status);
          setModalState('api-error');
          setShowModal(true);
          return;
        }

        setAccountsData(accountsJson);
        setHybridStepData(accountsJson);
        setHybridStepStatusCode(accountsResponse.status);
        setModalState('hybrid-step');
        setShowModal(true);
        return;
      }

      // Product step
      const productCfg = getProductConfigById(step.productId);
      if (!productCfg?.apiEndpoint) {
        throw new Error('Product API endpoint not configured');
      }

      setHybridStepTitle(step.title);
      setModalState('processing-product');
      setShowModal(true);

      let requestBody: any = {};

      if (step.isCRA) {
        if (usedUserToken && userToken) {
          requestBody.user_token = userToken;
        } else if (userId) {
          requestBody.user_id = userId;
        } else if (userToken) {
          requestBody.user_token = userToken;
        } else {
          throw new Error('Missing user_id/user_token for CRA call');
        }
        requestBody = buildProductRequestBody(requestBody, productCfg);
      } else {
        if (!tokenToUse) {
          throw new Error('Missing access_token for non-CRA call');
        }
        requestBody.access_token = tokenToUse;
        requestBody = buildProductRequestBody(requestBody, productCfg, accountsData);
      }

      const productResponse = await fetch(productCfg.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const productJson = await productResponse.json();
      if (productResponse.status >= 400) {
        setErrorData(productJson);
        setApiStatusCode(productResponse.status);
        setModalState('api-error');
        setShowModal(true);
        return;
      }

      setHybridStepData(productJson);
      setHybridStepStatusCode(productResponse.status);
      setModalState('hybrid-step');
      setShowModal(true);
    } catch (error) {
      console.error('[Hybrid] Error executing step:', error);
      setErrorMessage('We encountered an issue. Please try again.');
      setModalState('error');
      setShowModal(true);
    }
  };

  const handleHybridNext = async () => {
    const nextIndex = hybridStepIndex + 1;
    if (nextIndex >= hybridQueue.length) {
      handleStartOver();
      return;
    }
    setHybridStepIndex(nextIndex);
    await executeHybridStep(nextIndex);
  };

  const handleHostedLinkForward = async (publicTokens: string[]) => {
    try {
      setHostedLinkActive(false);
      setHostedLinkUrl(null);

      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = effectiveProductId ? getProductConfigById(effectiveProductId) : undefined;

      // Hybrid: exchange (use first public_token) then run the hybrid queue
      if (hybridModeActive) {
        const firstToken = publicTokens?.[0];
        if (!firstToken) {
          throw new Error('Missing public_token for hybrid flow');
        }

        setModalState('processing-accounts');
        setShowModal(true);

        const exchangeResponse = await fetch('/api/exchange-public-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token: firstToken }),
        });
        const exchangeJson = await exchangeResponse.json();
        if (!exchangeResponse.ok) {
          setErrorData(exchangeJson);
          setApiStatusCode(exchangeResponse.status);
          setModalState('api-error');
          setShowModal(true);
          return;
        }

        const access_token: string = exchangeJson.access_token;
        setAccessToken(access_token);

        const steps = buildHybridQueue(linkTokenConfig);
        setHybridQueue(steps);
        setHybridStepIndex(0);
        await executeHybridStep(0, access_token, steps);
        return;
      }

      // CRA-only: proceed with CRA flow (no token exchange required)
      if (productConfig?.isCRA) {
        if (!productConfig.apiEndpoint) {
          throw new Error('Product API endpoint not configured');
        }
        const baseParams: any = {};
        if (usedUserToken && userToken) {
          baseParams.user_token = userToken;
        } else if (userId) {
          baseParams.user_id = userId;
        } else if (userToken) {
          baseParams.user_token = userToken;
        }

        const requestBody = buildProductRequestBody(baseParams, productConfig);
        setProductApiConfig(requestBody);
        setModalState('preview-product-api');
        setShowModal(true);
        return;
      }

      // Non-CRA: exchange all tokens and continue standard flow (supports multi-item)
      await exchangePublicTokensAndProceed(publicTokens);
    } catch (error) {
      console.error('[Hosted Link] Error processing Forward:', error);
      setErrorMessage('We encountered an issue. Please try again.');
      setModalState('error');
      setShowModal(true);
    }
  };

  const handleCraLayerReportReadyForward = useCallback(() => {
    const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
    const productConfig = effectiveProductId ? getProductConfigById(effectiveProductId) : undefined;
    if (!productConfig?.isCRA || !productConfig.apiEndpoint) return;
    if (!userId) {
      setErrorData({
        error: 'MISSING_USER_ID',
        message: 'Missing user_id for CRA report fetch.',
      });
      setApiStatusCode(400);
      setModalState('api-error');
      setShowModal(true);
      return;
    }

    const requestBody = buildProductRequestBody({ user_id: userId }, productConfig);
    setProductApiConfig(requestBody);
    setHostedWaitingMode('hosted_link');
    setCraCheckReportExpectedUserId(null);
    setCraCheckReportManualReady(false);
    setHostedLinkManualPayload('');
    setHostedLinkManualParseError(null);
    setModalState('preview-product-api');
    setShowModal(true);
  }, [
    selectedGrandchildProduct,
    selectedChildProduct,
    selectedProduct,
    userId,
    buildProductRequestBody,
  ]);

  const handleUpgradeModeReportReadyForward = useCallback(() => {
    const config = linkTokenConfig;

    const productsArr = Array.isArray(config?.products) ? config.products : [];
    const requiredArr = Array.isArray(config?.required_if_supported_products) ? config.required_if_supported_products : [];
    const optionalArr = Array.isArray(config?.optional_products) ? config.optional_products : [];

    const merged = [...productsArr, ...requiredArr, ...optionalArr].filter(
      (p): p is string => typeof p === 'string' && p.length > 0
    );
    const unique = Array.from(new Set(merged));
    const craProducts = unique.filter((p) => p.startsWith('cra_'));

    const candidates = pickCraLeafConfigsForHybrid(craProducts);
    if (candidates.length === 0) {
      setErrorData({
        error: 'UPGRADE_MODE_NO_PRODUCTS',
        message:
          'No CRA leaf products could be determined from the /link/token/create config. Ensure products include CRA product strings (cra_...).',
        cra_products: craProducts,
        config,
      });
      setApiStatusCode(400);
      setModalState('api-error');
      setShowModal(true);
      return;
    }

    // Skip the intermediate picker screen. Default to the first candidate, and allow
    // switching via the selector in the Product API preview header.
    const first = candidates[0];
    if (!first?.apiEndpoint) {
      setErrorData({
        error: 'UPGRADE_MODE_NO_ENDPOINT',
        message: 'No Product API endpoint configured for the mapped CRA product.',
        candidates: candidates.map((c) => ({ id: c.id, apiEndpoint: c.apiEndpoint })),
      });
      setApiStatusCode(500);
      setModalState('api-error');
      setShowModal(true);
      return;
    }

    const baseParams: any = {};
    if (usedUserToken && userToken) {
      baseParams.user_token = userToken;
    } else if (userId) {
      baseParams.user_id = userId;
    } else if (userToken) {
      baseParams.user_token = userToken;
    } else {
      setErrorData({ error: 'MISSING_USER', message: 'Missing user_id/user_token for Upgrade Mode call.' });
      setApiStatusCode(400);
      setModalState('api-error');
      setShowModal(true);
      return;
    }

    const requestBody = buildProductRequestBody(baseParams, first);
    setUpgradeModeProductCandidates(candidates);
    setUpgradeModeSelectedProductIndex(0);
    setProductApiTargetProductId(first.id);
    setProductApiConfig(requestBody);
    setHostedWaitingMode('hosted_link');
    setCraCheckReportExpectedUserId(null);
    setCraCheckReportManualReady(false);
    setHostedLinkManualPayload('');
    setHostedLinkManualParseError(null);
    setModalState('preview-product-api');
    setShowModal(true);
  }, [
    linkTokenConfig,
    pickCraLeafConfigsForHybrid,
    setUpgradeModeProductCandidates,
    setUpgradeModeSelectedProductIndex,
    usedUserToken,
    userToken,
    userId,
    buildProductRequestBody,
  ]);

  const handleSelectMultiItemAccessToken = async (nextIndex: number) => {
    try {
      if (!Number.isFinite(nextIndex) || nextIndex < 0 || nextIndex >= multiItemAccessTokens.length) {
        return;
      }

      const next = multiItemAccessTokens[nextIndex];
      if (!next?.access_token) return;

      setActiveMultiItemAccessTokenIndex(nextIndex);
      setAccessToken(next.access_token);

      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      if (!productConfig) {
        throw new Error('Product configuration not found');
      }

      const isViewingProductSuccess = modalState === 'success' && !!productData && !!productConfig.apiEndpoint;

      // If the user is currently looking at a product response, re-run THAT same endpoint with the new token
      // (instead of bouncing them back through /accounts/get + accounts screen).
      if (isViewingProductSuccess) {
        setModalState('processing-product');
        setShowModal(true);

        const baseBody: any = productApiConfig && typeof productApiConfig === 'object' ? { ...productApiConfig } : {};
        baseBody.access_token = next.access_token;

        // If the current request uses account_id (or the product is known to need it), refresh it for the new Item.
        const needsAccountId =
          typeof baseBody.account_id === 'string' ||
          effectiveProductId === 'signal-evaluate' ||
          effectiveProductId === 'signal-balance';

        if (needsAccountId) {
          const accountsResponse = await fetch('/api/accounts-get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: next.access_token }),
          });
          const accountsJson = await accountsResponse.json();
          if (accountsResponse.status >= 400) {
            setErrorData(accountsJson);
            setApiStatusCode(accountsResponse.status);
            setModalState('api-error');
            return;
          }
          setAccountsData(accountsJson);

          const firstAccountId = accountsJson?.accounts?.[0]?.account_id;
          if (typeof firstAccountId === 'string' && firstAccountId.length > 0) {
            baseBody.account_id = firstAccountId;
          }
        }

        const productResponse = await fetch(productConfig.apiEndpoint!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseBody),
        });
        const productJson = await productResponse.json();
        if (productResponse.status >= 400) {
          setErrorData(productJson);
          setApiStatusCode(productResponse.status);
          setModalState('api-error');
          return;
        }
        setProductData(productJson);
        setApiStatusCode(productResponse.status);
        setModalState('success');
        return;
      }

      // Otherwise, fall back to the standard downstream flow with the selected token.
      setAccountsData(null);
      setProductData(null);

      setModalState('processing-accounts');
      setShowModal(true);

      const skipAccountsGet = effectiveProductId === 'signal-balance';
      if (!skipAccountsGet) {
        const accountsResponse = await fetch('/api/accounts-get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: next.access_token }),
        });
        const accountsJson = await accountsResponse.json();
        if (accountsResponse.status >= 400) {
          setErrorData(accountsJson);
          setApiStatusCode(accountsResponse.status);
          setModalState('api-error');
          return;
        }
        setAccountsData(accountsJson);
        setApiStatusCode(accountsResponse.status);
        setModalState('accounts-data');
      } else {
        setModalState('processing-product');

        if (!productConfig.apiEndpoint) {
          throw new Error('Product API endpoint not configured');
        }

        const requestBody = buildProductRequestBody(
          { access_token: next.access_token },
          productConfig
        );

        const productResponse = await fetch(productConfig.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        const productJson = await productResponse.json();
        if (productResponse.status >= 400) {
          setErrorData(productJson);
          setApiStatusCode(productResponse.status);
          setModalState('api-error');
          return;
        }
        setProductData(productJson);
        setApiStatusCode(productResponse.status);
        setModalState('success');
      }
    } catch (error) {
      console.error('[Multi-item Link] Error switching access_token:', error);
      setErrorMessage('We encountered an issue. Please try again.');
      setModalState('error');
      setShowModal(true);
    }
  };

  const getMultiItemTokenLabel = (info: MultiItemAccessTokenInfo, index: number) => {
    return info.institution_name || info.institution_id || info.item_id || `Item ${index + 1}`;
  };

  const CASHFLOW_UPDATES_QUALIFYING_CODES = useMemo(
    () => new Set(['CASH_FLOW_INSIGHTS_UPDATED', 'INSIGHTS_UPDATED']),
    []
  );

  const cashflowUpdatesSelectedItem = cashflowUpdatesItems[cashflowUpdatesSelectedIndex] || null;

  const cashflowUpdatesCombinedEvents = useMemo(() => {
    const devEvents = Array.isArray(webhooks) ? (webhooks as CashflowUpdatesWebhookEvent[]) : [];
    return [...cashflowUpdatesManualWebhooks, ...devEvents];
  }, [cashflowUpdatesManualWebhooks, webhooks]);

  const cashflowUpdatesQualifyingEvents = useMemo(() => {
    return cashflowUpdatesCombinedEvents
      .filter((e) => e.webhook_type === 'CASH_FLOW_UPDATES')
      .filter((e) => CASHFLOW_UPDATES_QUALIFYING_CODES.has(e.webhook_code))
      .filter((e) => !cashflowUpdatesSubscribedItemId || !e.item_id || e.item_id === cashflowUpdatesSubscribedItemId);
  }, [cashflowUpdatesCombinedEvents, CASHFLOW_UPDATES_QUALIFYING_CODES, cashflowUpdatesSubscribedItemId]);

  const cashflowUpdatesCanForward = cashflowUpdatesQualifyingEvents.length > 0;

  const handleCashflowUpdatesManualAdd = useCallback(() => {
    const raw = cashflowUpdatesManualPayload.trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      const nextEvents: CashflowUpdatesWebhookEvent[] = arr
        .map((obj: any, idx: number) => {
          const payload = obj?.payload && typeof obj?.payload === 'object' ? obj.payload : obj;
          const webhook_type = String(payload?.webhook_type || obj?.webhook_type || '').trim();
          const webhook_code = String(payload?.webhook_code || obj?.webhook_code || '').trim();
          const item_id = String(payload?.item_id || obj?.item_id || '').trim() || undefined;

          if (!webhook_type || !webhook_code) return null;

          return {
            id: `manual_${Date.now()}_${idx}`,
            webhook_type,
            webhook_code,
            item_id,
            timestamp: new Date().toISOString(),
            payload,
          };
        })
        .filter(Boolean) as CashflowUpdatesWebhookEvent[];

      if (nextEvents.length === 0) {
        setCashflowUpdatesManualParseError('No webhook events detected. Expected objects with webhook_type + webhook_code.');
        return;
      }

      setCashflowUpdatesManualWebhooks((prev) => [...nextEvents, ...prev]);
      setCashflowUpdatesManualParseError(null);
    } catch (err: any) {
      setCashflowUpdatesManualParseError(err?.message || 'Invalid JSON');
    }
  }, [cashflowUpdatesManualPayload]);

  const handleCashflowUpdatesSubscribe = useCallback(async () => {
    if (!cashflowUpdatesSelectedItem?.item_id) return;
    if (!effectiveWebhookConfigUrl) {
      setErrorData({
        error: 'WEBHOOK_URL_REQUIRED',
        message: 'Configure a webhook URL in Settings before subscribing to Cashflow Updates.',
      });
      setApiStatusCode(400);
      setModalState('api-error');
      setShowModal(true);
      return;
    }

    const baseParams: any = {
      item_id: cashflowUpdatesSelectedItem.item_id,
      webhook: effectiveWebhookConfigUrl,
    };
    if (usedUserToken && userToken) {
      baseParams.user_token = userToken;
    } else if (userId) {
      baseParams.user_id = userId;
    } else if (userToken) {
      baseParams.user_token = userToken;
    } else {
      setErrorData({ error: 'MISSING_USER', message: 'Missing user_id/user_token for CRA flow.' });
      setApiStatusCode(400);
      setModalState('api-error');
      setShowModal(true);
      return;
    }

    // Clear old events so Forward gating is for this subscription.
    setWebhooks([]);
    setCashflowUpdatesManualWebhooks([]);
    setCashflowUpdatesManualParseError(null);

    setModalState('cashflow-updates-subscribing');
    setShowModal(true);

    const resp = await fetch('/api/cra-cashflow-updates-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseParams),
    });
    const json = await resp.json();

    if (resp.status >= 400) {
      setErrorData(json);
      setApiStatusCode(resp.status);
      setModalState('api-error');
      setShowModal(true);
      return;
    }

    // Sandbox-only step (this app points to Sandbox): simulate a Cash Flow Update so Plaid
    // immediately delivers a CASH_FLOW_UPDATES webhook (e.g. CASH_FLOW_INSIGHTS_UPDATED w/ LARGE_DEPOSIT_DETECTED).
    // This is intentionally best-effort and should never block the UI.
    fetch('/api/cra-cashflow-updates-sandbox-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhook_codes: ['LARGE_DEPOSIT_DETECTED'],
        ...(baseParams.user_id ? { user_id: baseParams.user_id } : {}),
        ...(baseParams.user_token ? { user_token: baseParams.user_token } : {}),
      }),
    })
      .then(async (r) => {
        if (r.ok) return;
        let payload: any = null;
        try {
          payload = await r.json();
        } catch {
          // ignore
        }
        console.warn('[CRA Cashflow Updates] sandbox update trigger failed', r.status, payload);
      })
      .catch((err) => {
        console.warn('[CRA Cashflow Updates] sandbox update trigger failed', err);
      });

    setCashflowUpdatesSubscribedItemId(cashflowUpdatesSelectedItem.item_id);
    setCashflowUpdatesSubscriptionResponse(json);
    setModalState('cashflow-updates-webhooks');
    setShowModal(true);
  }, [
    cashflowUpdatesSelectedItem,
    effectiveWebhookConfigUrl,
    usedUserToken,
    userToken,
    userId,
  ]);

  const handleCashflowUpdatesFetchReport = useCallback(async () => {
    const baseParams: any = {
      consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
    };
    if (usedUserToken && userToken) {
      baseParams.user_token = userToken;
    } else if (userId) {
      baseParams.user_id = userId;
    } else if (userToken) {
      baseParams.user_token = userToken;
    } else {
      setErrorData({ error: 'MISSING_USER', message: 'Missing user_id/user_token for CRA flow.' });
      setApiStatusCode(400);
      setModalState('api-error');
      setShowModal(true);
      return;
    }

    setModalState('cashflow-updates-fetching-report');
    setShowModal(true);

    const resp = await fetch('/api/cra-cashflow-updates-get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseParams),
    });
    const json = await resp.json();

    if (resp.status >= 400) {
      setErrorData(json);
      setApiStatusCode(resp.status);
      setModalState('api-error');
      setShowModal(true);
      return;
    }

    setProductData(json);
    setApiStatusCode(resp.status);
    setModalState('success');
    setShowModal(true);
  }, [usedUserToken, userToken, userId]);

  const renderModalContent = () => {
    if (modalState === 'update-mode-input') {
      const raw = updateModeAccessTokenInput.trim();
      const tokenType: 'access_token' | 'user_token' | 'user_id' | null = raw.startsWith('access-')
        ? 'access_token'
        : raw.startsWith('user-')
          ? 'user_token'
          : raw.startsWith('usr_')
            ? 'user_id'
            : null;
      const canProceed = !!tokenType;
      const helperText =
        tokenType === 'access_token'
          ? 'Detected access_token (Item-based update mode)'
          : tokenType === 'user_token'
            ? 'Detected user_token (User-based update mode)'
            : tokenType === 'user_id'
              ? 'Detected user_id (User-based update mode)'
              : 'Enter an access_token (access-…), user_token (user-…), or user_id (usr_…).';

      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>Update Mode</h2>
          </div>
          <div className="account-data">
            <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85 }}>
              Paste an <code>access_token</code>, <code>user_token</code>, or <code>user_id</code> to start Update Mode.
            </p>
            <textarea
              value={updateModeAccessTokenInput}
              onChange={(e) => setUpdateModeAccessTokenInput(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                minHeight: 110,
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 12,
                color: 'rgba(255, 255, 255, 0.9)',
                padding: 12,
                fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
                fontSize: 12,
                resize: 'vertical',
              }}
              placeholder={'access-sandbox-...\nuser-sandbox-...\nusr_...'}
            />
            <p style={{ marginTop: 10, marginBottom: 0, opacity: 0.75, fontSize: 12 }}>
              {helperText}
            </p>
            {!canProceed && raw.length > 0 && (
              <div className="config-error" style={{ marginTop: 10 }}>
                Unrecognized token format. Expected prefixes: <code>access-</code>, <code>user-</code>, or <code>usr_</code>.
              </div>
            )}
          </div>
          <div className="modal-button-row two-buttons">
            <ArrowButton
              variant="red"
              direction="back"
              onClick={handleGoBackToProducts}
            />
            <ArrowButton
              variant="blue"
              disabled={!canProceed}
              onClick={() => {
                const value = updateModeAccessTokenInput.trim();
                if (!value) return;
                const detectedType: 'access_token' | 'user_token' | 'user_id' | null = value.startsWith('access-')
                  ? 'access_token'
                  : value.startsWith('user-')
                    ? 'user_token'
                    : value.startsWith('usr_')
                      ? 'user_id'
                      : null;
                if (!detectedType) return;

                const cfg: any = {
                  link_customization_name: 'flash',
                  // Update Mode (user-based): user.client_user_id must be supplied and should match the existing user.
                  // We surface it in the config editor as an explicit required field.
                  user:
                    detectedType === 'user_token' || detectedType === 'user_id'
                      ? { ...(includePhoneNumber ? { phone_number: '+14155550011' } : {}), client_user_id: '' }
                      : includePhoneNumber
                        ? { phone_number: '+14155550011' }
                        : {},
                  client_name: 'Plaid Flash',
                  country_codes: ['US'],
                  language: 'en',
                };

                if (detectedType === 'access_token') {
                  cfg.access_token = value;
                } else if (detectedType === 'user_token') {
                  cfg.user_token = value;
                  cfg.update = { user: true };
                } else if (detectedType === 'user_id') {
                  cfg.user_id = value;
                  cfg.update = { user: true };
                }

                // Respect Hosted Link setting: use Hosted Link if enabled (completion via LINK/SESSION_FINISHED)
                if (hostedLinkEnabled) {
                  cfg.hosted_link = {};
                  if (effectiveWebhookConfigUrl) {
                    cfg.webhook = effectiveWebhookConfigUrl;
                  }
                }

                setLinkTokenConfig(cfg);
                setModalState('preview-config');
              }}
            />
          </div>
        </div>
      );
    }

    if (modalState === 'layer-phone-submit') {
      const canSubmit = !!ready && String(layerPhoneSubmitConfig?.phone_number || '').trim().length > 0;
      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>Layer: submit phone number</h2>
          </div>
            <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85, fontSize: 13 }}>
              Use 415-555-0012 for Extended Autofill testing.
            </p>
          {!isEditingLayerPhoneSubmitConfig ? (
            <>
              <div className="account-data config-data-with-edit">
                <button
                  className="config-edit-button"
                  onClick={handleToggleLayerPhoneSubmitEditMode}
                  title="Edit configuration"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <JsonHighlight data={layerPhoneSubmitConfig} />
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={returnToProductMenuNoRemove} />
                <ArrowButton variant="blue" disabled={!canSubmit} onClick={handleLayerSubmitPhone} />
              </div>
            </>
          ) : (
            <>
              <div className="code-editor-container">
                <CodeEditor
                  value={editedLayerPhoneSubmitConfig}
                  language="json"
                  onChange={(e) => setEditedLayerPhoneSubmitConfig(e.target.value)}
                  padding={15}
                  data-color-mode="dark"
                  style={{
                    fontSize: 13,
                    fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    minHeight: '200px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                  }}
                />
                {layerPhoneSubmitConfigError && <div className="config-error">{layerPhoneSubmitConfigError}</div>}
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={handleCancelLayerPhoneSubmitEdit} />
                <ArrowButton variant="blue" onClick={handleSaveLayerPhoneSubmitConfig} />
              </div>
            </>
          )}
        </div>
      );
    }

    if (modalState === 'layer-dob-submit') {
      const canSubmit = !!ready && String(layerDobSubmitConfig?.date_of_birth || '').trim().length > 0;
      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>⛔️ LAYER_NOT_AVAILABLE</h2>
          </div>
          <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85, fontSize: 13 }}>
              Submit the user's date of birth to attempt Extended Autofill, or return to the main menu.
            </p>
          {!isEditingLayerDobSubmitConfig ? (
            <>
              <div className="account-data config-data-with-edit">
                <button
                  className="config-edit-button"
                  onClick={handleToggleLayerDobSubmitEditMode}
                  title="Edit configuration"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <JsonHighlight data={layerDobSubmitConfig} />
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={returnToProductMenuNoRemove} />
                <ArrowButton variant="blue" disabled={!canSubmit} onClick={handleLayerSubmitDob} />
              </div>
            </>
          ) : (
            <>
              <div className="code-editor-container">
                <CodeEditor
                  value={editedLayerDobSubmitConfig}
                  language="json"
                  onChange={(e) => setEditedLayerDobSubmitConfig(e.target.value)}
                  padding={15}
                  data-color-mode="dark"
                  style={{
                    fontSize: 13,
                    fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    minHeight: '200px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                  }}
                />
                {layerDobSubmitConfigError && <div className="config-error">{layerDobSubmitConfigError}</div>}
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={handleCancelLayerDobSubmitEdit} />
                <ArrowButton variant="blue" onClick={handleSaveLayerDobSubmitConfig} />
              </div>
            </>
          )}
        </div>
      );
    }

    if (modalState === 'layer-processing-session-get') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Fetching Layer session data...</p>
        </div>
      );
    }

    if (modalState === 'layer-processing-user-update') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Updating CRA identity...</p>
        </div>
      );
    }

    if (modalState === 'layer-processing-check-report-create') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Creating CRA check report...</p>
        </div>
      );
    }

    if (modalState === 'layer-processing-identity-match') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Running Identity Match...</p>
        </div>
      );
    }

    if (modalState === 'layer-identity-match-results') {
      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>Layer: Identity Match</h2>
          </div>
          <div className="account-data">
            <JsonHighlight data={layerIdentityMatchData || {}} />
          </div>
          <div className="modal-button-row two-buttons">
            <ArrowButton variant="red" direction="back" onClick={returnToProductMenuNoRemove} />
            <ArrowButton variant="blue" onClick={handleProceedAfterLayerIdentityMatch} />
          </div>
        </div>
      );
    }

    // CRA: User Create Preview Modal
    if (modalState === 'preview-user-create' && userCreateConfig) {
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      const isCRA = productConfig?.isCRA;
      const isUpgradeMode = effectiveProductId === 'link-upgrade-mode';
      
      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>Step 1: Here&apos;s the /user/create configuration:</h2>
          </div>
          {isUpgradeMode && (
            <div className="account-data" style={{ paddingTop: 0, paddingBottom: 0 }}>
              <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85, fontSize: 12 }}>
                Enter the <code>client_user_id</code> you want to use for this Upgrade Mode session in the config below.
              </p>
            </div>
          )}
          {!isEditingUserCreateConfig ? (
            <>
              <div className="account-data config-data-with-edit">
                <button 
                  className="config-edit-button" 
                  onClick={handleToggleUserCreateEditMode}
                  title="Edit configuration"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <JsonHighlight data={userCreateConfig} />
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={handleGoBackToProducts} />
                <ArrowButton variant="blue" onClick={() => handleProceedWithUserCreate()} />
              </div>
            </>
          ) : (
            <>
              <div className="code-editor-container">
                <CodeEditor
                  value={editedUserCreateConfig}
                  language="json"
                  onChange={(e) => setEditedUserCreateConfig(e.target.value)}
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
                {userCreateConfigError && (
                  <div className="config-error">
                    {userCreateConfigError}
                  </div>
                )}
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={handleCancelUserCreateEdit} />
                <ArrowButton variant="blue" onClick={handleSaveAndProceedUserCreate} />
              </div>
            </>
          )}
        </div>
      );
    }

    // Layer + CRA: User Update Preview Modal
    if (modalState === 'preview-user-update' && userUpdateConfig) {
      const displayConfig = sanitizeUserUpdateConfigForDisplay(userUpdateConfig);
      const validationError = validateUserUpdatePayload(userUpdateConfig);
      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>Layer + CRA: Here&apos;s the /user/update payload that will be sent:</h2>
          </div>
          {!isEditingUserUpdateConfig ? (
            <>
              <div className="account-data config-data-with-edit">
                <button className="config-edit-button" onClick={handleToggleUserUpdateEditMode} title="Edit configuration">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <JsonHighlight data={displayConfig} />
              </div>
              {(userUpdateConfigError || validationError) && (
                <div className="config-error">{userUpdateConfigError || validationError}</div>
              )}
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={returnToProductMenuNoRemove} />
                <ArrowButton variant="blue" disabled={!!(userUpdateConfigError || validationError)} onClick={() => handleProceedWithUserUpdate()} />
              </div>
            </>
          ) : (
            <>
              <div className="code-editor-container">
                <CodeEditor
                  value={editedUserUpdateConfig}
                  language="json"
                  onChange={(e) => setEditedUserUpdateConfig(e.target.value)}
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
                {userUpdateConfigError && <div className="config-error">{userUpdateConfigError}</div>}
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={handleCancelUserUpdateEdit} />
                <ArrowButton variant="blue" onClick={handleSaveAndProceedUserUpdate} />
              </div>
            </>
          )}
        </div>
      );
    }

    if (modalState === 'processing-user-create') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Creating user...</p>
        </div>
      );
    }

    if (modalState === 'preview-config' && linkTokenConfig) {
      // Check if this is a CRA product to modify the back button behavior
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      const requiresUserCreateStep = !!productConfig?.isCRA || multiItemLinkEnabled;
      
      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>{requiresUserCreateStep ? 'Step 2: ' : ''}Here&apos;s the /link/token/create configuration that will be used:</h2>
          </div>
          {!isEditingConfig ? (
            <>
              <div className="account-data config-data-with-edit">
                <button 
                  className="config-edit-button" 
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
                <ArrowButton variant="red" direction="back" onClick={requiresUserCreateStep ? handleGoBackToUserCreate : handleGoBackToProducts} />
                <ArrowButton variant="blue" onClick={() => handleProceedWithConfig(linkTokenConfig)} />
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

    if (modalState === 'preview-sandbox-config' && sandboxConfig) {
      // Check if this is a CRA product to modify the back button behavior
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      const isCRA = productConfig?.isCRA;
      
      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>{isCRA ? 'Step 2: ' : ''}Here&apos;s the /sandbox/public_token/create configuration:</h2>
          </div>
          {!isEditingSandboxConfig ? (
            <>
              <div className="account-data config-data-with-edit">
                <button 
                  className="config-edit-button" 
                  onClick={handleToggleSandboxConfigEditMode}
                  title="Edit configuration"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <JsonHighlight data={sandboxConfig} />
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={isCRA ? handleGoBackToUserCreate : handleGoBackToProducts} />
                <ArrowButton variant="blue" onClick={() => handleProceedWithBypassLink(sandboxConfig)} />
              </div>
            </>
          ) : (
            <>
              <div className="code-editor-container">
                <CodeEditor
                  value={editedSandboxConfig}
                  language="json"
                  onChange={(e) => setEditedSandboxConfig(e.target.value)}
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
                {sandboxConfigError && (
                  <div className="config-error">
                    {sandboxConfigError}
                  </div>
                )}
              </div>
              <div className="modal-button-row two-buttons">
                <ArrowButton variant="red" direction="back" onClick={handleCancelSandboxConfigEdit} />
                <ArrowButton variant="blue" onClick={handleSaveAndProceedWithSandboxConfig} />
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
            <h3>onSuccess Callback Fired!</h3>
          </div>
          <div className="account-data">
            <JsonHighlight 
              data={callbackData} 
              suppressCarbonButton={true}
              expandableCopy={{
                responseData: callbackData,
                linkToken: linkToken
              }}
            />
          </div>
          <div className="modal-button-row single-button">
            <ArrowButton variant="blue" onClick={handleProceedWithSuccess} />
          </div>
        </div>
      );
    }

    if (modalState === 'upgrade-mode-pick-product') {
      const candidates = upgradeModeProductCandidates || [];
      const selectedIdx = Math.min(Math.max(upgradeModeSelectedProductIndex, 0), Math.max(candidates.length - 1, 0));
      const selectedCfg = candidates[selectedIdx] || null;

      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>Upgrade Mode</h2>
          </div>

          <div className="account-data">
            <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85 }}>
              Select which CRA endpoint you’d like to call.
            </p>
            <select
              className="access-token-picker"
              value={selectedIdx}
              onChange={(e) => setUpgradeModeSelectedProductIndex(Number(e.target.value))}
              aria-label="Select product"
              disabled={candidates.length <= 1}
            >
              {candidates.map((cfg, idx) => (
                <option key={cfg.id} value={idx}>
                  {cfg.name}
                </option>
              ))}
            </select>

            {selectedCfg && (
              <div className="account-data config-data-with-edit" style={{ marginTop: 14 }}>
                <JsonHighlight data={{ product_id: selectedCfg.id, api: selectedCfg.apiTitle || selectedCfg.apiEndpoint }} />
              </div>
            )}
          </div>

          <div className="modal-button-row two-buttons">
            <ArrowButton variant="red" direction="back" onClick={() => setModalState('callback-success')} />
            <ArrowButton
              variant="blue"
              disabled={!selectedCfg || !selectedCfg.apiEndpoint}
              onClick={() => {
                if (!selectedCfg?.apiEndpoint) return;
                const baseParams: any = {};
                if (usedUserToken && userToken) {
                  baseParams.user_token = userToken;
                } else if (userId) {
                  baseParams.user_id = userId;
                } else if (userToken) {
                  baseParams.user_token = userToken;
                } else {
                  setErrorData({ error: 'MISSING_USER', message: 'Missing user_id/user_token for Upgrade Mode call.' });
                  setApiStatusCode(400);
                  setModalState('api-error');
                  setShowModal(true);
                  return;
                }

                const requestBody = buildProductRequestBody(baseParams, selectedCfg);
                setProductApiConfig(requestBody);
                setProductApiTargetProductId(selectedCfg.id);
                setModalState('preview-product-api');
                setShowModal(true);
              }}
            />
          </div>
        </div>
      );
    }

    if (modalState === 'callback-exit' && callbackData) {
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const isUpdateMode = effectiveProductId === 'link-update-mode';

      return (
        <div className="modal-callback">
          <div className="callback-header">
            <div className="callback-icon exit-callback">✕</div>
            <h2>onExit Callback Fired</h2>
          </div>
          <div className="account-data">
            <JsonHighlight 
              data={callbackData} 
              suppressCarbonButton={true}
              expandableCopy={{
                responseData: callbackData,
                linkToken: linkToken
              }}
            />
          </div>
          <div className="modal-button-row single-button">
            <ArrowButton variant="red" onClick={isUpdateMode ? returnToProductMenuNoRemove : handleExitRetry} />
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
            <JsonHighlight 
              data={callbackData} 
              suppressCarbonButton={true}
              expandableCopy={{
                responseData: callbackData,
                linkToken: linkToken
              }}
            />
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
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      const productName = productConfig?.name || 'Product';
      
      return (
        <div className="modal-success">
          <div className="success-header">
            <div className="success-icon">✓</div>
            <h2>/accounts/get Response</h2>
            {multiItemLinkEnabled && !productConfig?.isCRA && multiItemAccessTokens.length > 1 && (
              <select
                className="access-token-picker"
                value={activeMultiItemAccessTokenIndex}
                onChange={(e) => handleSelectMultiItemAccessToken(Number(e.target.value))}
                aria-label="Select access token"
              >
                {multiItemAccessTokens.map((info, idx) => (
                  <option key={idx} value={idx}>
                    {getMultiItemTokenLabel(info, idx)}
                  </option>
                ))}
              </select>
            )}
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
            <ArrowButton variant="blue" onClick={hybridModeActive && productConfig?.isCRA ? handleHybridNext : handleCallProduct} />
          </div>
        </div>
      );
    }

    if (modalState === 'hybrid-step' && hybridStepData) {
      const currentHybridStep = hybridQueue[hybridStepIndex];
      const currentHybridProductConfig =
        currentHybridStep?.kind === 'product' ? getProductConfigById(currentHybridStep.productId) : undefined;

      return (
        <div className="modal-success">
          <div className="success-header">
            <div className="success-icon">✓</div>
            <h2>{hybridStepTitle}</h2>
            {hybridStepStatusCode && <span className="status-code">{hybridStepStatusCode}</span>}
          </div>
          <div className="account-data">
            <JsonHighlight
              data={hybridStepData}
              highlightKeys={currentHybridProductConfig?.highlightKeys}
              expandableCopy={{
                responseData: hybridStepData,
                accessToken: accessToken,
                userId: userId,
                userToken: userToken,
                isCRA: true,
              }}
            />
          </div>
          <div className="modal-button-row single-button">
            <ArrowButton
              variant="blue"
              onClick={hybridStepIndex >= hybridQueue.length - 1 ? handleStartOver : handleHybridNext}
            />
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

    if (modalState === 'hosted-waiting') {
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = effectiveProductId ? getProductConfigById(effectiveProductId) : undefined;
      const isUpdateMode = effectiveProductId === 'link-update-mode';
      const isUpgradeMode = effectiveProductId === 'link-upgrade-mode';
      const isCraReportWaiting = hostedWaitingMode === 'cra_check_report';
      const allowForwardWithoutTokens = !isCraReportWaiting && (isUpdateMode || !!productConfig?.isCRA) && !hybridModeActive;

      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>{isCraReportWaiting ? 'CRA Report' : 'Hosted Link'}</h2>
          </div>

          {!isCraReportWaiting && hostedLinkUrl && (
            <div style={{ marginBottom: 12 }}>
              <button
                className="action-button button-blue"
                onClick={() => {
                  try {
                    window.open(hostedLinkUrl, '_blank');
                  } catch {
                    // ignore
                  }
                }}
              >
                Open Hosted Link
              </button>
            </div>
          )}

          {IS_DEV ? (
            <MultiItemWebhookPanel
              enabled={true}
              linkToken={linkToken}
              webhooks={webhooks}
              onForward={(tokens) =>
                isCraReportWaiting
                  ? isUpgradeMode
                    ? handleUpgradeModeReportReadyForward()
                    : handleCraLayerReportReadyForward()
                  : isUpdateMode
                    ? returnToProductMenuNoRemove()
                    : handleHostedLinkForward(tokens)
              }
              title="Webhooks"
              allowForwardWithoutTokens={allowForwardWithoutTokens}
              mode={isCraReportWaiting ? 'check_report' : 'link'}
              expectedUserId={isCraReportWaiting ? craCheckReportExpectedUserId : null}
            />
          ) : (
            <>
              <div className="account-data">
                <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85 }}>
                  {isCraReportWaiting ? (
                    <>
                      Paste the full <code>USER_CHECK_REPORT_READY</code> webhook JSON payload below.
                    </>
                  ) : (
                    <>
                      Paste the full <code>SESSION_FINISHED</code> webhook JSON payload below.
                    </>
                  )}
                </p>
                <textarea
                  value={hostedLinkManualPayload}
                  onChange={(e) => {
                    const text = e.target.value;
                    setHostedLinkManualPayload(text);
                    if (!text.trim()) {
                      setHostedLinkManualParseError(null);
                      setHostedLinkExtractedPublicTokens([]);
                      setCraCheckReportManualReady(false);
                      return;
                    }
                    try {
                      if (isCraReportWaiting) {
                        const parsed = JSON.parse(text);
                        const webhook_type = parsed?.webhook_type;
                        const webhook_code = parsed?.webhook_code;
                        const user_id = parsed?.user_id;
                        if (webhook_type !== 'CHECK_REPORT') {
                          throw new Error('Expected webhook_type CHECK_REPORT');
                        }
                        if (webhook_code !== 'USER_CHECK_REPORT_READY') {
                          throw new Error('Expected webhook_code USER_CHECK_REPORT_READY');
                        }
                        if (craCheckReportExpectedUserId && user_id && user_id !== craCheckReportExpectedUserId) {
                          throw new Error('Webhook user_id does not match current user');
                        }
                        setCraCheckReportManualReady(true);
                        setHostedLinkManualParseError(null);
                        setHostedLinkExtractedPublicTokens([]);
                      } else {
                        const tokens = parseHostedLinkSessionFinished(text);
                        setHostedLinkExtractedPublicTokens(tokens);
                        setHostedLinkManualParseError(null);
                      }
                    } catch (err: any) {
                      setHostedLinkExtractedPublicTokens([]);
                      setCraCheckReportManualReady(false);
                      setHostedLinkManualParseError(err?.message || 'Invalid payload');
                    }
                  }}
                  rows={10}
                  style={{
                    width: '100%',
                    minHeight: 220,
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 12,
                    color: 'rgba(255, 255, 255, 0.9)',
                    padding: 12,
                    fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
                    fontSize: 12,
                    resize: 'vertical',
                  }}
                  placeholder={
                    isCraReportWaiting
                      ? '{\n  "webhook_type": "CHECK_REPORT",\n  "webhook_code": "USER_CHECK_REPORT_READY",\n  "user_id": "usr_..."\n}'
                      : '{\n  "webhook_type": "LINK",\n  "webhook_code": "SESSION_FINISHED",\n  "public_tokens": ["public-..."]\n}'
                  }
                />
                {hostedLinkManualParseError && (
                  <div className="config-error" style={{ marginTop: 10 }}>
                    {hostedLinkManualParseError}
                  </div>
                )}
              </div>
              <div className="modal-button-row two-buttons">
                <button
                  className="action-button button-red"
                  onClick={() => {
                    setHostedLinkManualPayload('');
                    setHostedLinkManualParseError(null);
                    setHostedLinkExtractedPublicTokens([]);
                    setCraCheckReportManualReady(false);
                  }}
                >
                  Clear
                </button>
                <ArrowButton
                  variant="blue"
                  onClick={() => {
                    if (isCraReportWaiting) {
                      if (isUpgradeMode) {
                        handleUpgradeModeReportReadyForward();
                      } else {
                        handleCraLayerReportReadyForward();
                      }
                      return;
                    }
                    if (isUpdateMode) {
                      returnToProductMenuNoRemove();
                      return;
                    }
                    handleHostedLinkForward(hostedLinkExtractedPublicTokens);
                  }}
                  disabled={
                    isCraReportWaiting
                      ? !craCheckReportManualReady
                      : !allowForwardWithoutTokens && hostedLinkExtractedPublicTokens.length === 0
                  }
                />
              </div>
            </>
          )}
        </div>
      );
    }

    if (modalState === 'cashflow-updates-loading-items') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Fetching your Items...</p>
        </div>
      );
    }

    if (modalState === 'cashflow-updates-pick-item') {
      const selected = cashflowUpdatesSelectedItem;

      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>Cashflow Updates</h2>
          </div>

          <div className="account-data">
            <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85 }}>
              Select which Item you’d like to subscribe to Cashflow Updates.
            </p>

            <select
              className="access-token-picker"
              value={cashflowUpdatesSelectedIndex}
              onChange={(e) => setCashflowUpdatesSelectedIndex(Number(e.target.value))}
              aria-label="Select institution"
            >
              {cashflowUpdatesItems.map((it, idx) => (
                <option key={`${it.item_id}_${idx}`} value={idx}>
                  {it.institution_name}
                </option>
              ))}
            </select>

            {selected?.item_id && (
              <div className="account-data config-data-with-edit" style={{ marginTop: 14 }}>
                <JsonHighlight data={{ item_id: selected.item_id }} />
              </div>
            )}
          </div>

          <div className="modal-button-row two-buttons">
            <ArrowButton variant="red" direction="back" onClick={handleStartOver} />
            <ArrowButton variant="blue" onClick={handleCashflowUpdatesSubscribe} disabled={!selected?.item_id} />
          </div>
        </div>
      );
    }

    if (modalState === 'cashflow-updates-subscribing') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Subscribing to Cashflow Updates...</p>
        </div>
      );
    }

    if (modalState === 'cashflow-updates-webhooks') {
      const allowManualPaste = !IS_DEV;
      const selected = cashflowUpdatesSelectedItem;

      return (
        <div className="modal-success">
          <div className="success-header">
            <h2>Cashflow Updates</h2>
          </div>

          {selected?.item_id && (
            <div className="account-data">
              <div className="account-data config-data-with-edit" style={{ marginTop: 0 }}>
                <JsonHighlight data={{ institution_name: selected.institution_name, item_id: selected.item_id }} />
              </div>
              {cashflowUpdatesSubscriptionResponse && (
                <div className="account-data config-data-with-edit" style={{ marginTop: 14 }}>
                  <JsonHighlight data={cashflowUpdatesSubscriptionResponse} />
                </div>
              )}
            </div>
          )}

          <CashflowUpdatesWebhookPanel
            visible={true}
            subscribedItemId={cashflowUpdatesSubscribedItemId}
            events={cashflowUpdatesCombinedEvents}
            allowManualPaste={allowManualPaste}
            manualPayload={cashflowUpdatesManualPayload}
            onManualPayloadChange={(value) => setCashflowUpdatesManualPayload(value)}
            onManualAdd={handleCashflowUpdatesManualAdd}
            manualParseError={cashflowUpdatesManualParseError}
            canForward={cashflowUpdatesCanForward}
            onForward={handleCashflowUpdatesFetchReport}
          />
        </div>
      );
    }

    if (modalState === 'cashflow-updates-fetching-report') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Fetching Monitoring Insights report...</p>
        </div>
      );
    }

    if (modalState === 'processing-product') {
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      const productName = productConfig?.name || 'Product';
      
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Fetching {productName} data...</p>
        </div>
      );
    }

    if (modalState === 'creating-sandbox-item') {
      return (
        <div className="modal-loading">
          <div className="spinner"></div>
          <p>Creating Sandbox item</p>
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
            <button className="reset-icon-button" onClick={handleStartOver} title="Back to main menu" style={{ background: 'linear-gradient(135deg, #c7659f 0%, #c43d52 100%)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
              </svg>
            </button>
          </div>
          <div className="account-data">
            <JsonHighlight 
              data={errorData} 
              showCopyButton={true}
            />
          </div>
          <div className="modal-button-row single-button">
            <ArrowButton variant="red" direction="back" onClick={handleGoBackFromApiError} />
          </div>
        </div>
      );
    }

    if (modalState === 'preview-product-api' && productApiConfig) {
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productIdForApi =
        effectiveProductId === 'link-upgrade-mode' ? productApiTargetProductId || effectiveProductId : effectiveProductId;
      const productConfig = getProductConfigById(productIdForApi!);
      const isCRA = productConfig?.isCRA;
      
      // Extract endpoint name from apiEndpoint (e.g., "/api/transactions-get" -> "/transactions/get")
      const apiName = productConfig?.apiTitle || '';
      
      // Check if we should show webhook panel (CRA products in Bypass Link mode)
      const showEmbeddedWebhookPanel = WEBHOOKS_ENABLED && webhookUrl && isCRA && bypassLink;
      
      // Remove useAltCredentials from display (it's internal, not sent to Plaid)
      const { useAltCredentials: _, ...displayConfig } = productApiConfig;
      
      return (
        <>
          <div className="modal-success">
            <div className="success-header">
              <h2>Here&apos;s the {apiName} call that will be made:</h2>
              {effectiveProductId === 'link-upgrade-mode' && upgradeModeProductCandidates.length > 0 && (
                <select
                  className="access-token-picker"
                  value={
                    Math.max(
                      0,
                      upgradeModeProductCandidates.findIndex((c) => c.id === (productApiTargetProductId || upgradeModeProductCandidates[0]?.id))
                    )
                  }
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    const nextCfg = upgradeModeProductCandidates[idx];
                    if (!nextCfg) return;

                    const baseParams: any = {};
                    if (usedUserToken && userToken) {
                      baseParams.user_token = userToken;
                    } else if (userId) {
                      baseParams.user_id = userId;
                    } else if (userToken) {
                      baseParams.user_token = userToken;
                    } else {
                      return;
                    }

                    const nextBody = buildProductRequestBody(baseParams, nextCfg);
                    setProductApiTargetProductId(nextCfg.id);
                    setProductApiConfig(nextBody);
                    setIsEditingProductApiConfig(false);
                    setEditedProductApiConfig('');
                    setProductApiConfigError(null);
                  }}
                  aria-label="Select product"
                  disabled={upgradeModeProductCandidates.length <= 1}
                >
                  {upgradeModeProductCandidates.map((cfg, idx) => (
                    <option key={cfg.id} value={idx}>
                      {cfg.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {!isEditingProductApiConfig ? (
              <>
                <div className="account-data config-data-with-edit">
                  <button 
                    className="config-edit-button" 
                    onClick={handleToggleEditProductApiMode}
                    title="Edit configuration"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <JsonHighlight data={displayConfig} />
                </div>
                <div className="modal-button-row two-buttons">
                  <ArrowButton variant="red" direction="back" onClick={handleGoBackFromProductApiPreview} />
                  <ArrowButton variant="blue" onClick={() => handleProceedWithProductApi()} />
                </div>
              </>
            ) : (
              <>
                <div className="code-editor-container">
                  <CodeEditor
                    value={editedProductApiConfig}
                    language="json"
                    onChange={(e) => setEditedProductApiConfig(e.target.value)}
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
                  {productApiConfigError && (
                    <div className="config-error">
                      {productApiConfigError}
                    </div>
                  )}
                </div>
                <div className="modal-button-row two-buttons">
                  <ArrowButton variant="red" direction="back" onClick={handleCancelProductApiEdit} />
                  <ArrowButton variant="blue" onClick={handleSaveAndProceedWithProductApi} />
                </div>
              </>
            )}
          </div>
          
          {/* Embedded Webhook Panel for CRA Bypass Link */}
          {showEmbeddedWebhookPanel && (
            <div className="modal-success" style={{ marginTop: '20px' }}>
              <div className="webhook-panel-embedded">
                <div className="webhook-panel-header">
                  <h3>Webhooks</h3>
                  {webhooks.length > 0 && (
                    <span className="webhook-count">{webhooks.length}</span>
                  )}
                </div>
                
                <div className="webhook-panel-content">
                  {webhooks.length > 0 ? (
                    <div className="webhook-scroll">
                      {webhooks.map((webhook, index) => (
                        <div key={webhook.id} className={`webhook-item ${index % 2 === 0 ? 'even' : 'odd'}`}>
                          <div className="webhook-item-header">
                            <span className="webhook-time">
                              {new Date(webhook.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                              })}
                            </span>
                            <span className="webhook-type">{webhook.webhook_type}</span>
                            <span className="webhook-code">{webhook.webhook_code}</span>
                          </div>
                          <div className="webhook-payload">
                            <JsonHighlight data={webhook.payload} showCopyButton={false} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="webhook-placeholder">
                      <pre className="code-block">
                        <code>... waiting for webhooks</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      );
    }

    if (modalState === 'success' && productData) {
      const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
      const productConfig = getProductConfigById(effectiveProductId!);
      const apiTitle = productConfig?.apiTitle || 'API Response';
      const isCRA = productConfig?.isCRA;
      const isIncomeInsights = effectiveProductId === 'cra-income-insights';
      
      return (
        <div className="modal-success">
          <div className="success-header">
            <div className="success-icon">✓</div>
            <h2>{apiTitle} Response</h2>
            {multiItemLinkEnabled && !isCRA && multiItemAccessTokens.length > 1 && (
              <select
                className="access-token-picker"
                value={activeMultiItemAccessTokenIndex}
                onChange={(e) => handleSelectMultiItemAccessToken(Number(e.target.value))}
                aria-label="Select access token"
              >
                {multiItemAccessTokens.map((info, idx) => (
                  <option key={idx} value={idx}>
                    {getMultiItemTokenLabel(info, idx)}
                  </option>
                ))}
              </select>
            )}
            {demoLinkCompleted && (
              <button className="reset-icon-button" onClick={handleStartOver} title="Reset Session" style={{ background: 'linear-gradient(135deg, #c7659f 0%, #c43d52 100%)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                </svg>
              </button>
            )}
          </div>

          {/* Tab buttons for CRA Income Insights */}
          {isIncomeInsights && (
            <div className="view-mode-tabs">
              <button
                className={`view-mode-tab ${viewMode === 'json' ? 'active' : ''}`}
                onClick={() => setViewMode('json')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                JSON
              </button>
              <button
                className={`view-mode-tab ${viewMode === 'visual' ? 'active' : ''}`}
                onClick={() => setViewMode('visual')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                Visual
              </button>
            </div>
          )}

          <div className="account-data">
            {productConfig?.returnsPdf ? (
              <PdfResponseViewer
                base64={productData[productConfig.pdfResponseKey ?? 'pdf']}
                filename="income-insights.pdf"
              />
            ) : isIncomeInsights && viewMode === 'visual' ? (
              <IncomeInsightsVisualization data={productData} />
            ) : (
              <JsonHighlight 
                data={productData} 
                highlightKeys={productConfig?.highlightKeys}
                expandableCopy={isCRA ? {
                  responseData: productData,
                  userId: userId,
                  userToken: userToken,
                  isCRA: true
                } : {
                  responseData: productData,
                  accessToken: accessToken || demoAccessToken
                }}
              />
            )}
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
            ? PRODUCTS_ARRAY.filter((p) => p.id !== 'link' && !p.id.startsWith('link-') && demoProductsVisibility[p.id])
            : PRODUCTS_ARRAY} 
          onSelect={handleProductSelect}
          isDisabled={getProductDisableInfo}
          onSettingsClick={demoLinkCompleted ? undefined : handleOpenSettings}
          hasCustomSettings={hasCustomSettings}
          onResetClick={demoLinkCompleted ? handleStartOver : undefined}
        />
      </Modal>
      <Modal isVisible={showChildModal}>
        {selectedProduct && PRODUCT_CONFIGS[selectedProduct]?.children && (
          <ProductSelector 
            products={demoLinkCompleted 
              ? PRODUCT_CONFIGS[selectedProduct].children!.filter((c) => c.id !== 'link' && !c.id.startsWith('link-') && demoProductsVisibility[c.id])
              : PRODUCT_CONFIGS[selectedProduct].children!} 
            onSelect={handleChildProductSelect}
            isDisabled={getProductDisableInfo}
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
      <Modal isVisible={showGrandchildModal}>
        {selectedProduct && selectedChildProduct && (() => {
          const parentConfig = PRODUCT_CONFIGS[selectedProduct];
          const childConfig = parentConfig?.children?.find(c => c.id === selectedChildProduct);
          return childConfig?.children && (
            <ProductSelector 
              products={demoLinkCompleted 
                ? childConfig.children.filter((gc) => gc.id !== 'link' && !gc.id.startsWith('link-') && demoProductsVisibility[gc.id])
                : childConfig.children} 
              onSelect={handleGrandchildProductSelect}
              isDisabled={getProductDisableInfo}
              onBack={() => {
                setShowGrandchildModal(false);
                setSelectedGrandchildProduct(null);
                setShowChildModal(true);
              }}
              showBackButton={true}
              onSettingsClick={demoLinkCompleted ? undefined : handleOpenSettings}
              hasCustomSettings={hasCustomSettings}
              title={childConfig.name}
              onResetClick={demoLinkCompleted ? handleStartOver : undefined}
            />
          );
        })()}
      </Modal>
      <Modal isVisible={showSettingsModal}>
        <div className="settings-modal">
          <a
            className="settings-gear-button settings-docs-button"
            href="https://github.com/only-devices/plaid-flash-v2/tree/main?tab=readme-ov-file#plaid-flash"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open README documentation"
            title="Docs"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" />
              <path d="M12 17h.01" />
            </svg>
          </a>
          <div className="settings-scroll-area">
            <div className="settings-header">
              <h2>Settings</h2>
            </div>
            <div className="settings-tabs" role="tablist" aria-label="Settings tabs">
              <button
                type="button"
                role="tab"
                aria-selected={settingsTab === 'flash'}
                className={`settings-tab ${settingsTab === 'flash' ? 'active' : ''}`}
                onClick={() => setSettingsTab('flash')}
              >
                Flash
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={settingsTab === 'link'}
                className={`settings-tab ${settingsTab === 'link' ? 'active' : ''}`}
                onClick={() => setSettingsTab('link')}
              >
                Link
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={settingsTab === 'advanced'}
                className={`settings-tab ${settingsTab === 'advanced' ? 'active' : ''}`}
                onClick={() => setSettingsTab('advanced')}
              >
                Advanced
              </button>
            </div>
            <div className="settings-grid">
              {settingsTab === 'flash' && (
                <>
                  <SettingsToggle
                    label="Demo Mode"
                    checked={tempDemoMode}
                    onChange={handleToggleDemo}
                    disabled={tempZapMode}
                  />
                  <SettingsToggle
                    label="⚡️ Mode"
                    checked={tempZapMode}
                    onChange={handleToggleZap}
                    disabled={tempDemoMode}
                  />
                  <SettingsToggle
                    label="Layer"
                    checked={tempLayerMode}
                    onChange={handleToggleLayer}
                  disabled={!effectiveWebhookConfigUrlForSettings || tempEmbeddedMode || tempHostedLinkEnabled || tempMultiItemLinkEnabled || tempBypassLink}
                  tooltip={
                    !effectiveWebhookConfigUrlForSettings
                      ? (IS_DEV
                          ? 'Webhook URL not active (configure NGROK_AUTHTOKEN)'
                          : 'Set your webhook URL below to enable Layer')
                      : tempEmbeddedMode
                        ? 'Disable Embedded Link to use Layer'
                        : tempHostedLinkEnabled
                          ? 'Disable Hosted Link to use Layer'
                          : tempMultiItemLinkEnabled
                            ? 'Disable Multi-item Link to use Layer'
                            : tempBypassLink
                              ? 'Disable Bypass Link to use Layer'
                              : undefined
                  }
                />
                <SettingsToggle
                  label="Layer Identity Match"
                  checked={tempLayerIdentityMatchEnabled}
                  onChange={handleToggleLayerIdentityMatch}
                  disabled={!tempLayerMode}
                  tooltip={!tempLayerMode ? 'Enable Layer to use this' : undefined}
                  />
                </>
              )}

              {settingsTab === 'link' && (
                <>
                  <SettingsToggle
                    label="Embedded Link"
                    checked={tempEmbeddedMode}
                    onChange={handleToggleEmbedded}
                  disabled={tempLayerMode}
                  tooltip={tempLayerMode ? 'Disable Layer to use Embedded Link' : undefined}
                  />
                  <SettingsToggle
                    label="Hosted Link"
                    checked={tempHostedLinkEnabled}
                    onChange={handleToggleHostedLink}
                  disabled={tempLayerMode || !effectiveWebhookConfigUrlForSettings}
                  tooltip={
                    tempLayerMode
                      ? 'Disable Layer to use Hosted Link'
                      : !effectiveWebhookConfigUrlForSettings
                        ? 'Set your webhook URL below to enable Hosted Link'
                        : undefined
                  }
                  />
                  <SettingsToggle
                    label="Multi-item Link"
                    checked={tempMultiItemLinkEnabled}
                    onChange={handleToggleMultiItemLink}
                  disabled={tempLayerMode || !effectiveWebhookConfigUrlForSettings || tempBypassLink}
                    tooltip={
                    tempLayerMode
                      ? 'Disable Layer to use Multi-item Link'
                      : tempBypassLink
                        ? 'Disable Bypass Link to use Multi-item Link'
                        : !effectiveWebhookConfigUrlForSettings
                          ? (IS_DEV
                              ? 'Webhook URL not active (configure NGROK_AUTHTOKEN)'
                              : 'Set your webhook URL below to enable Multi-item Link')
                          : undefined
                    }
                  />
                  <SettingsToggle
                    label="Bypass Link"
                    checked={tempBypassLink}
                    onChange={handleToggleBypassLink}
                  disabled={tempLayerMode}
                  tooltip={tempLayerMode ? 'Disable Layer to use Bypass Link' : undefined}
                  />
                  <SettingsToggle
                    label="Include phone_number in Link Token Create config"
                    checked={tempIncludePhoneNumber}
                    onChange={handleToggleIncludePhoneNumber}
                    disabled={false}
                  />
                </>
              )}

              {settingsTab === 'advanced' && (
                <>
                  <SettingsToggle
                    label="Use ALT_PLAID_CLIENT_ID"
                    checked={tempUseAltCredentials}
                    onChange={handleToggleAltCredentials}
                    disabled={!altCredentialsAvailable}
                  />
                  <SettingsToggle
                    label="Use legacy user_token"
                    checked={tempUseLegacyUserToken}
                    onChange={handleToggleLegacyUserToken}
                    disabled={false}
                  />
                  <SettingsToggle
                    label="Remove items and users automatically"
                    checked={tempAutoRemoveEnabled}
                    onChange={handleToggleAutoRemove}
                    disabled={false}
                  />
                </>
              )}
            </div>
          </div>

          <div className="settings-info-row">
            <span className="settings-info-label">Webhook URL</span>
            <span className="settings-info-value">
              {IS_DEV ? (
                webhookUrl ? webhookUrl : 'Not active'
              ) : (
                <input
                  className="settings-webhook-url-input"
                  type="url"
                  inputMode="url"
                  placeholder="https://your-public-webhook-url"
                  value={tempWebhookUrlOverride}
                  onChange={(e) => setTempWebhookUrlOverride(e.target.value)}
                />
              )}
            </span>
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
            {PRODUCTS_ARRAY.filter((p) => p.id !== 'link' && !p.id.startsWith('link-')).map(product => (
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
                      {product.children
                        .filter((c) => c.id !== 'link' && !c.id.startsWith('link-'))
                        .map(child => (
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

      {/* Embedded Link Container - Shows when embedded mode is active, hidden after institution selection */}
      {embeddedLinkActive && !embeddedInstitutionSelected && (
        <>
          <div className="embedded-link-overlay" />
          <div className={`embedded-link-container ${embeddedLinkReady ? 'ready' : ''}`} ref={embeddedContainerRef} />
        </>
      )}
      
      {/* Event Logs Modal - Shows side by side with Plaid Link (above embedded overlay when embedded mode) */}
      <div className={`event-logs-container ${showEventLogs ? 'visible' : ''} ${embeddedLinkActive ? 'event-logs-above-embedded' : ''} event-logs-${eventLogsPosition} ${isTransitioningModals ? 'fading-out' : ''} ${isMultiItemFlowActive ? 'multiitem' : ''}`}>
        <div className="event-logs-modal">
          <div className="modal-success">
            <div className="success-header">
              <h3>🟢 onEvent Callbacks</h3>
            </div>
            <div className="event-logs-wrapper">
              <div 
                className={`json-copy-expandable ${eventLogsExpanded ? 'expanded' : ''} ${eventLogsSliding ? 'sliding' : ''}`}
                onMouseEnter={() => !eventLogsSliding && setEventLogsExpanded(true)}
                onMouseLeave={() => !eventLogsSliding && setEventLogsExpanded(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}
              >
                <div className="expandable-menu">
                  <button 
                    className="expandable-pill-button"
                    onClick={async () => {
                      if (linkEvents.length > 0) {
                        try {
                          await navigator.clipboard.writeText(JSON.stringify(linkEvents, null, 2));
                          setEventLogsCopied(true);
                          setEventLogsSliding(true);
                          setTimeout(() => {
                            setEventLogsExpanded(false);
                            setEventLogsSliding(false);
                            setTimeout(() => {
                              setEventLogsCopied(false);
                            }, 300);
                          }, 1500);
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }
                    }}
                    disabled={linkEvents.length === 0}
                  >
                    All Logs
                  </button>
                  {linkToken && (
                    <button 
                      className="expandable-pill-button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(linkToken);
                          setEventLogsCopied(true);
                          setEventLogsSliding(true);
                          setTimeout(() => {
                            setEventLogsExpanded(false);
                            setEventLogsSliding(false);
                            setTimeout(() => {
                              setEventLogsCopied(false);
                            }, 300);
                          }, 1500);
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }}
                    >
                      Link Token
                    </button>
                  )}
                </div>
                <button 
                  className={`json-copy-button expandable-icon ${eventLogsCopied ? 'copied' : ''}`}
                  aria-label="Copy options"
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
              </div>
              <div className="event-logs-scroll" ref={eventLogsRef}>
                {linkEvents.length > 0 ? (
                  linkEvents.map((event, index) => (
                    <div key={index} className={`event-log-item ${index % 2 === 0 ? 'even' : 'odd'}`}>
                      <JsonHighlight data={event} showCopyButton={false} suppressCarbonButton={true} />
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

        {/* Multi-item Link webhook viewer (inline, under onEvent logs) */}
        <MultiItemWebhookPanel
          enabled={isMultiItemFlowActive}
          linkToken={linkToken}
          webhooks={webhooks}
          onForward={handleMultiItemForward}
        />
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
                        const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
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
                {(() => {
                  const effectiveProductId = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
                  const productConfig = getProductConfigById(effectiveProductId!);
                  if (productConfig?.returnsPdf) {
                    const pdfKey = productConfig.pdfResponseKey ?? 'pdf';
                    return (
                      <PdfResponseViewer
                        base64={productData[pdfKey]}
                        filename="income-insights.pdf"
                      />
                    );
                  }
                  return (
                    <JsonHighlight 
                      data={productData} 
                      highlightKeys={productConfig?.highlightKeys}
                      expandableCopy={{
                        responseData: productData,
                        accessToken: accessToken
                      }}
                    />
                  );
                })()}
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

      {/* Webhook Panel - Shows after onSuccess/onExit callbacks (only for products that require webhooks) */}
      {WEBHOOKS_ENABLED && webhookUrl && (
        <WebhookPanel
          webhooks={webhooks}
          visible={
            showWebhookPanel &&
            (() => {
              const id = selectedGrandchildProduct || selectedChildProduct || selectedProduct;
              return !!id && !!getProductConfigById(id)?.requiresWebhook;
            })()
          }
        />
      )}
    </div>
  );
}

