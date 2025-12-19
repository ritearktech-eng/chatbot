import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("w-full", className)}
        {...props}
    />
))
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
            className
        )}
        {...props}
    />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; activeTab?: string; setActiveTab?: (value: string) => void }
>(({ className, value, activeTab, setActiveTab, onClick, ...props }, ref) => {
    const isActive = activeTab === value;
    return (
        <button
            ref={ref}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? "active" : "inactive"}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive && "bg-background text-foreground shadow-sm",
                className
            )}
            onClick={(e) => {
                if (setActiveTab) setActiveTab(value);
                if (onClick) onClick(e);
            }}
            {...props}
        />
    )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string; activeTab?: string }
>(({ className, value, activeTab, ...props }, ref) => {
    if (value !== activeTab) return null;
    return (
        <div
            ref={ref}
            role="tabpanel"
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
})
TabsContent.displayName = "TabsContent"

// Simple Context-less wrapper to handle state if not provided
const TabsRoot = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { defaultValue: string }
>(({ defaultValue, children, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue);

    // Cloning children to pass props is a bit messy, let's use a simpler approach or Context if needed.
    // For a quick custom implementation without Context:
    const renderChildren = (nodes: React.ReactNode): React.ReactNode => {
        return React.Children.map(nodes, (child) => {
            if (!React.isValidElement(child)) return child;

            // Pass props deep? No, just top level for List and Content
            if (child.type === TabsList) {
                return React.cloneElement(child as React.ReactElement<any>, {
                    children: React.Children.map((child as React.ReactElement<any>).props.children, (trigger) => {
                        if (!React.isValidElement(trigger)) return trigger;
                        if (trigger.type === TabsTrigger) {
                            return React.cloneElement(trigger as React.ReactElement<any>, { activeTab, setActiveTab });
                        }
                        return trigger;
                    })
                } as any);
            }
            if (child.type === TabsContent) {
                return React.cloneElement(child as React.ReactElement<any>, { activeTab });
            }
            return child;
        });
    };

    return (
        <Tabs ref={ref} {...props}>
            {renderChildren(children)}
        </Tabs>
    );
});
TabsRoot.displayName = "TabsRoot";

export { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent }
