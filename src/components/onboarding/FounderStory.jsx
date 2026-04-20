export default function FounderStory({ onContinue, minimal = false, showButton = true }) {

    const shortStory = [
        'Hi, my name is Sahil Inamdar and I am the founder of Niyama.',
        'Five years ago, as a young scientist with a PhD focusing on cancer immunotherapy, I began developing cures for diseases like Sepsis, Traumatic Brain Injury and cancer. Since 2025 I have been focused on Alzheimer\'s and Parkinson\'s — diseases that steal independence, memory and the ability to recognise the faces you love.',
        'But as I spent years searching for cures, a question kept nagging at me: what if we never had to get here in the first place?',
        'The science is unambiguous — sleep, movement, screen time and circadian rhythm are the foundation on which these diseases are built or prevented. The problem is never knowledge. The problem is doing it every single day. Every habit app I found relied on streaks and badges. None changed the underlying economics of behaviour. Skipping a habit costs nothing. So people skip.',
        'That\'s why I built Niyama. A daily discipline platform where consistency is rewarded financially — based on the same reinforcement principles we use in clinical research.',
        'Living healthy every single day — not for others, but for yourself.',
    ]

    const longStory = [
        'Hi, my name is Sahil Inamdar and I am the founder of Niyama.',
        'Five years ago, as a young scientist with a PhD focusing on cancer immunotherapy, I embarked on my journey in the biotech industry with a sole purpose of developing cures for patients suffering from devastating diseases. I worked on conditions like Sepsis, Traumatic Brain Injury, Rheumatoid Arthritis and cancers currently being tested in clinical trials. Since 2025, I have been focused on neurodegenerative diseases like Alzheimer\'s and Parkinson\'s. These unforgiving diseases lead to the loss of independence, of memory, and the inability to recognise the faces they love. Every day in the lab, as I understood more about disease immunology, it was heartbreaking to realise what these diseases do to us.',
        'But as I spent years searching for cures, a question kept nagging at me: what if we never had to get here in the first place?',
        'The scientific literature is unambiguous. Sleep deprivation accelerates neurodegeneration. Sedentary behaviour drives metabolic disease. Chronic screen exposure disrupts dopamine and cortisol regulation. Irregular wake times destabilise the circadian rhythm.',
        'The five habits in Niyama are not arbitrary. They were chosen because the evidence for each is overwhelming. These are the highest-leverage daily behaviours known to science for extending healthspan and reducing the risk of the diseases I have spent my career trying to cure.',
        'The problem was never that people didn\'t know this. The problem is that knowing something and doing it every single day are completely different challenges. Motivation fades. Willpower is finite. Every habit app I found relied entirely on streaks and badges. None of them changed the underlying economics of behaviour. Skipping a habit costs nothing. So people skip.',
        'That\'s why I built Niyama. A daily discipline platform where your behaviour has real financial consequences. Consistency is rewarded. The rewards are real enough to actually change behaviour — not as a gimmick, but as a scientifically grounded intervention based on the same reinforcement principles we use in clinical research.',
        'The goal is simple. Living healthy every single day — not for others, but for yourself.',
    ]

    const story = minimal ? longStory : shortStory

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)' }} className="px-4 py-10 max-w-lg mx-auto">

            {!minimal && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px' }}>
                            Beta testing version
                        </span>
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--theme-text)' }}>Niyama</h1>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: '12px', color: 'var(--theme-primary)' }}>A message from the founder</h2>
                    </div>
                </>
            )}

            <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>

                {story.map((para, i) => (
                    <p key={i} style={{
                        fontSize: '14px',
                        lineHeight: '1.85',
                        color: i === 0 ? 'var(--theme-text)' : 'var(--theme-text-secondary)',
                        fontStyle: 'italic',
                        fontWeight: i === 0 ? '500' : '400',
                        marginBottom: i < story.length - 1 ? '16px' : '0',
                    }}>
                        {para}
                    </p>
                ))}

                <div style={{ borderTop: '1px solid var(--theme-border)', marginTop: '20px', paddingTop: '20px' }}>
                    {!minimal && (
                        <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text-secondary)', marginBottom: '12px' }}>
                            Thank you for being one of our first beta testers. Your experience over the coming weeks will directly shape the future of Niyama. I am grateful you are here.
                        </p>
                    )}
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--theme-text)' }}>
                        — Sahil Inamdar, Founder
                    </p>
                </div>
            </div>

            {showButton && (
                <button onClick={onContinue}
                    style={{ background: 'var(--theme-primary)', color: 'white', width: '100%', fontWeight: '600', padding: '14px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
                    Continue
                </button>
            )}

        </div>
    )
}