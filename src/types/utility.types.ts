import type { ReactNode } from "react";

export type ModalPropsTypes = {
    isOpen: boolean;
    onClose: () => void;
    overlayClose: boolean;
    xButton: boolean;
    title: string;
    subheading?: string;
    children: ReactNode;
}