/**
 * i18n.js — compatibility shim
 * The canonical translation function `t` now lives in userStore.js.
 * All existing imports of `getTranslation` from this file continue to work.
 */
export { t as getTranslation, translations } from '../store/userStore';

export default {};
