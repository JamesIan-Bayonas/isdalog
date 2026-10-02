export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p
            {...props}
            role="alert"
            className={`isd-ui-error ${className}`}
        >
            {message}
        </p>
    ) : null;
}
