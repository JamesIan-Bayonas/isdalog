import { useEffect, useState } from 'react';

const sections = [
    { id: 'fisherman-overview', label: 'Overview' },
    { id: 'fisherman-catches', label: 'My catches' },
    { id: 'fisherman-sales', label: 'Sales & pickups' },
    { id: 'fisherman-payments', label: 'Earnings & withdrawals' },
    { id: 'fisherman-records', label: 'Recent records' },
];

export default function FishermanSectionNav() {
    const [activeId, setActiveId] = useState(sections[0].id);

    useEffect(() => {
        let frame = null;
        const update = () => {
            frame = null;
            let current = sections[0].id;
            for (const { id } of sections) {
                if (document.getElementById(id)?.getBoundingClientRect().top <= 128) current = id;
            }
            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
                current = sections[sections.length - 1].id;
            }
            setActiveId(current);
        };
        const schedule = () => {
            if (frame === null) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        return () => {
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <nav id="fisherman-section-navigation" tabIndex={-1} className="isd-fisherman-sections isd-fisherman-anchor" aria-label="Fisherman dashboard sections">
            {sections.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={activeId === id ? 'location' : undefined} onClick={() => setActiveId(id)}>{label}</a>)}
        </nav>
    );
}
