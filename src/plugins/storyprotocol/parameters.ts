export interface RegisterIPAssetParameters {
  name: string;
  description: string;
  mediaUrl: string;
  contentHash: string;
  externalUrl?: string;
}

export interface AttachTermsParameters {
  ipId: string;
  termsUrl: string;
  termsHash: string;
}

export interface MintLicenseTokenParameters {
  ipId: string;
  licenseTermsUrl: string;
  licenseTermsHash: string;
  mintTo: string;
}

export interface RegisterDerivativeParameters {
  parentIpId: string;
  name: string;
  description: string;
  mediaUrl: string;
  contentHash: string;
  externalUrl?: string;
  isCommercial: boolean;
}

export interface PayIPAssetParameters {
  ipId: string;
  amount: string;
}

export interface ClaimRevenueParameters {
  ipId: string;
}
