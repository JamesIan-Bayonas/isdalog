export default function ApplicationLogo({ className = '', ...props }) {
    return (
        <img
            {...props}
            src="/images/isdalog-logo-mark.png"
            alt="IsdaLog"
            className={`object-contain ${className}`}
        />
    );
}
