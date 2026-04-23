 'use client';
 
  import {
   useId,
   useRef,
   useEffect,
   createContext,
   useContext,
   useState,
    Children,
    cloneElement,
    isValidElement,
  } from 'react';
 import { createPortal } from 'react-dom';
 import { cn } from '@/lib/utils';
 import useClickOutside from '@/hooks/useClickOutside';
import LucideIcon from '@/components/LucideIcon';
 
 type DialogContextValue = {
   isOpen: boolean;
   open: () => void;
   close: () => void;
   uniqueId: string;
 };
 
 const DialogContext = createContext<DialogContextValue | null>(null);
 
 function useDialogLogic({
   defaultOpen = false,
   open: controlledOpen,
   onOpenChange,
 }: {
   defaultOpen?: boolean;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
 } = {}) {
   const uniqueId = useId();
   const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
   const isOpen = controlledOpen ?? uncontrolledOpen;
 
   const open = () => {
     if (controlledOpen === undefined) setUncontrolledOpen(true);
     onOpenChange?.(true);
   };
 
   const close = () => {
     if (controlledOpen === undefined) setUncontrolledOpen(false);
     onOpenChange?.(false);
   };
 
   return { isOpen, open, close, uniqueId };
 }
 
 export type DialogProps = {
   children: React.ReactNode;
   defaultOpen?: boolean;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   className?: string;
 } & React.ComponentProps<'div'>;
 
 function Dialog({
   children,
   defaultOpen,
   open,
   onOpenChange,
   className,
   ...props
 }: DialogProps) {
   const logic = useDialogLogic({ defaultOpen, open, onOpenChange });
   return (
     <DialogContext.Provider value={logic}>
       <div className={cn('relative', className)} key={logic.uniqueId} {...props}>
         {children}
       </div>
     </DialogContext.Provider>
   );
 }
 
 export type DialogTriggerProps = {
   children: React.ReactNode;
   className?: string;
   asChild?: boolean;
 } & React.ComponentProps<'div'>;
 
 function DialogTrigger({ children, className, asChild, ...props }: DialogTriggerProps) {
   const context = useContext(DialogContext);
   if (!context) throw new Error('DialogTrigger must be used within Dialog');
 
   const { key, ...restTriggerProps } = {
    key: context.uniqueId,
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      context.open();
    },  
     className: cn(
       'appearance-none bg-transparent border-none p-0 m-0 text-left cursor-pointer w-full h-full block relative z-10',
       className
     ),
     role: "button",
     tabIndex: 0,
     "aria-expanded": context.isOpen,
     "aria-controls": `dialog-content-${context.uniqueId}`,
     onKeyDown: (e: React.KeyboardEvent) => {
       if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         context.open();
       }
     },
     ...props
   };

   if (asChild && isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return cloneElement(child, {
        key,
        ...restTriggerProps,
        className: cn(restTriggerProps.className, child.props.className),
        onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          restTriggerProps.onClick(e);
          child.props.onClick?.(e);
        },
      });
    }

   return (
     <div key={key} {...restTriggerProps}>
       {children}
     </div>
   );
 }
 
 export type DialogContentProps = {
   children: React.ReactNode;
   className?: string;
  /**
   * Shows a consistent close button in the top-right corner.
   * Set to `false` to hide it for specific dialog layouts.
   */
  showCloseButton?: boolean;
 } & React.ComponentProps<'div'>;
 
function DialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
   const context = useContext(DialogContext);
   if (!context) throw new Error('DialogContent must be used within Dialog');
 
   const ref = useRef<HTMLDivElement>(null);
   useClickOutside(ref, context.close);
 
  useEffect(() => {
    if (!context || !context.isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') context.close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [context]);

  if (typeof document === 'undefined') return null;
 
   return createPortal(
     context.isOpen ? (
       <div className="fixed inset-0 z-[9999]">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={context.close}
        />
         <div className="absolute inset-0 flex items-center justify-center p-4">
           <div
             {...props}
             ref={ref}
             key={context.uniqueId}
             id={`dialog-content-${context.uniqueId}`}
             role="dialog"
             aria-modal="true"
             className={cn(
              'relative overflow-hidden rounded-xl border border-white/10 bg-[#000]/95 p-0 text-white shadow-xl pointer-events-auto',
               className
             )}
                >
            {showCloseButton && (
              <button
                key="dialog-close-button"
                type="button"
                aria-label="Close dialog"
                onClick={(e) => {
                  e.stopPropagation();
                  context.close();
                }}
                className="absolute top-6 right-6 z-50 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 p-2 text-white/70 hover:text-white transition-all pointer-events-auto"
              >
                <LucideIcon name="x" className="w-5 h-5" />
              </button>
            )}
                 {children}
           </div>
         </div>
       </div>
     ) : null,
     document.body
   );
 }
 
 export { Dialog, DialogTrigger, DialogContent };
