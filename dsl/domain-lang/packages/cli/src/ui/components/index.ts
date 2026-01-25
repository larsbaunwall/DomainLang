/**
 * Component library exports.
 * All UI components MUST be exported from this file.
 * 
 * @module ui/components
 */

// Feedback components
export {
    StatusMessage,
    SuccessMessage,
    ErrorMessage,
    WarningMessage,
    InfoMessage,
    type StatusMessageProps,
} from './StatusMessage.js';

export {
    Spinner,
    LoadingWithTimer,
    type SpinnerProps,
    type LoadingWithTimerProps,
} from './Spinner.js';

// Data display components
export {
    Table,
    KeyValue,
    List,
    type TableProps,
    type KeyValueProps,
    type ListProps,
} from './Table.js';

export {
    Divider,
    Spacer,
    type DividerProps,
    type SpacerProps,
} from './Divider.js';

// Input components
export {
    KeyboardHints,
    SelectHints,
    MultiSelectHints,
    TextInputHints,
    ConfirmHints,
    HINT_PRESETS,
    type KeyboardHintsProps,
} from './KeyboardHints.js';

// Branding components (Phase 2)
export { Header, type HeaderProps } from './Header.js';
export { ThemedGradient, type ThemedGradientProps } from './ThemedGradient.js';
export { SectionHeader, type SectionHeaderProps } from './SectionHeader.js';

// Layout components
export {
    Banner,
    InfoBox,
    SuccessBanner,
    ErrorBanner,
    WarningBanner,
    type BannerProps,
} from './Banner.js';

export {
    Footer,
    MinimalFooter,
    type FooterProps,
} from './Footer.js';
