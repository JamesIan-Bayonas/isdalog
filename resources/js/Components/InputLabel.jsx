export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={`isd-ui-label ${className}`}
        >
            {value ? value : children}
        </label>
    );
}
