export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={`isd-ui-button isd-ui-button-danger ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
