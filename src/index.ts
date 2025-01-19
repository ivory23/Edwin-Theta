import { Edwin } from './edwin-client';

export { Edwin };
export * from "./edwin-core/actions/lending";
export * from "./edwin-core/actions/stake";
export * from "./edwin-core/components/evm_wallet";
export * from "./types";

// For CommonJS compatibility
export default Edwin;
