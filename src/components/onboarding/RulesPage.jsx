export default function RulesPage({ onContinue, showButton = true }) {
    const card = { background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)' }} className="px-4 py-10 max-w-lg mx-auto pb-24">

            {showButton && (
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px' }}>
                        Beta testing version
                    </span>
                </div>
            )}

            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '24px' }}>How Niyama works</h1>

            <div style={card}>
                <h3 style={{ fontWeight: '600', color: 'var(--theme-text)', marginBottom: '16px' }}>Your 5 daily habits</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { habit: 'Wake before 7:30 AM', complete: '+100 pts', incomplete: '-50 pts', flex: false },
                        { habit: 'Steps 10,000 or more', complete: '+100 pts', incomplete: '-75 pts', flex: false },
                        { habit: 'Screen time under 3 hrs', complete: '+100 pts', incomplete: 'no penalty', flex: true },
                        { habit: 'Sleep by 10:30 PM', complete: '+100 pts', incomplete: '-50 pts', flex: false },
                        { habit: '30 min active heart rate', complete: '+100 pts', incomplete: '-75 pts', flex: false },
                    ].map(item => (
                        <div key={item.habit} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>{item.habit}</span>
                                {item.flex && (
                                    <span style={{ fontSize: '10px', background: 'var(--theme-secondary-light)', color: 'var(--theme-secondary)', padding: '1px 6px', borderRadius: '8px', fontWeight: '500' }}>flex</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                <span style={{ color: 'var(--theme-primary)', fontWeight: '500' }}>{item.complete}</span>
                                <span style={{ color: 'var(--theme-text-muted)' }}>/</span>
                                <span style={{ color: item.flex ? 'var(--theme-text-muted)' : 'var(--theme-secondary)', fontWeight: '500' }}>{item.incomplete}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={card}>
                <h3 style={{ fontWeight: '600', color: 'var(--theme-text)', marginBottom: '16px' }}>Points system</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                        { label: 'Base points per day', value: '250 pts', highlight: false },
                        { label: 'Per habit completed', value: '+100 pts', highlight: true },
                        { label: 'Complete any 4 of 5 bonus', value: '+100 pts', highlight: true },
                        { label: 'Perfect day total', value: '750 pts', highlight: false },
                        { label: 'Worst day total', value: '0 pts', highlight: false },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: item.highlight ? 'var(--theme-primary)' : 'var(--theme-text)' }}>{item.value}</span>
                        </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>Points to money</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-primary)' }}>1,000 pts = $1.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>Maximum monthly</span>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--theme-text)' }}>22,500 pts = $22.50</span>
                    </div>
                </div>
            </div>

            <div style={card}>
                <h3 style={{ fontWeight: '600', color: 'var(--theme-text)', marginBottom: '16px' }}>Reward eligibility rules</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        'Minimum successful days to qualify: Basic = 10 days, Plus = 7 days, Premium = 5 days. A successful day means completing any 4 out of 5 habits.',
                        'No more than 5 consecutive inactive days. Exceeding this disqualifies you from rewards that month.',
                        'Reward = min(points value, tier cap). Points value = monthly points divided by 1,000.',
                        'Rewards reset at the start of every month. Points do not carry over.',
                        'Premium users with a 25-day continuous streak receive a flat $25 payout.',
                    ].map((rule, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--theme-primary)', flexShrink: '0' }}>{i + 1}.</span>
                            <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>{rule}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: '600', color: '#dc2626', marginBottom: '12px' }}>Honor system and fair play</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                        'Niyama operates on an honor system. All habit logging is self-reported and trust-based.',
                        'Users found fraudulently reporting habits will be permanently disqualified from rewards and may have their account suspended.',
                        'Niyama reserves the right to audit user behaviour and revoke eligibility at any time.',
                        'This system works because of the integrity of its users. Please be honest — not for Niyama, but for yourself.',
                    ].map((text, i) => (
                        <p key={i} style={{ fontSize: '14px', color: '#dc2626', lineHeight: '1.6' }}>{text}</p>
                    ))}
                </div>
            </div>

            {showButton && (
                <button onClick={onContinue}
                    style={{ background: 'var(--theme-primary)', color: 'white', width: '100%', fontWeight: '600', padding: '14px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
                    I understand
                </button>
            )}

        </div>
    )
}