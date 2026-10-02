export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={`isd-ui-button isd-ui-button-primary ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
