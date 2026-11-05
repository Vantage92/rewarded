// Design system barrel (UX §5.5). Features import from '../../design/index.ts'.
export { Button, ButtonLink, type ButtonProps, type ButtonLinkProps, type ButtonVariant } from './components/Button.tsx';
export { Card, type CardProps, type CardVariant } from './components/Card.tsx';
export { List, ListItem, Avatar, initials, type ListProps, type ListItemProps } from './components/List.tsx';
export { ProgressRing, ProgressBar, type ProgressRingProps, type ProgressProps } from './components/ProgressRing.tsx';
export { TimerDisplay, timerParts, type TimerDisplayProps } from './components/TimerDisplay.tsx';
export { ToastProvider, useToast, TOAST_MS, type ToastApi } from './components/Toast.tsx';
export { Modal, type ModalProps, type ModalAction } from './components/Modal.tsx';
export { BottomSheet, type BottomSheetProps } from './components/BottomSheet.tsx';
export { FormField, TextField, type FormFieldProps, type TextFieldProps, type FieldControlProps } from './components/FormField.tsx';
export { Segment, type SegmentProps, type SegmentOption } from './components/Segment.tsx';
export { Switch, type SwitchProps } from './components/Switch.tsx';
export { Chip, type ChipTone } from './components/Chip.tsx';
export { Banner, type BannerProps } from './components/Banner.tsx';
export { useFocusTrap } from './components/useFocusTrap.ts';
export { ThemeProvider, useTheme, applyTheme, THEME_PREFERENCES, type ThemePreference, type ResolvedTheme, type ThemeValue } from './theme.tsx';
export { ThemeSwitch, LanguageSwitch } from './ThemeSwitch.tsx';
export { token, type TokenName } from './tokens.gen.ts';
