export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={`isd-ui-checkbox ${className}`}
        />
    );
}
