import { Button, Radio, RadioGroup, Switch } from '@nisakhantalib/my-ui-kit';
import { LogOut } from 'lucide-react';
import type { Preferences, Theme, Tier } from '../App';
import { useBank } from '../bank';
import { MARKETS, type Market } from '../data';
import { Avatar, PageHeader, Panel } from '../ui';

export function Settings({ prefs }: { prefs: Preferences }) {
  const { t, market, hideBalances, setHideBalances, tier } = useBank();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title={t('settingsTitle')} intro={t('settingsIntro')} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel>
          <div className="mb-6 flex items-center gap-4">
            <Avatar name={market.customerFull} size={56} />
            <div>
              <p className="text-lg font-semibold">{market.customerFull}</p>
              <p className="text-muted">{tier === 'private' ? t('privateTier') : t('personal')}</p>
            </div>
          </div>
          <RadioGroup
            legend={t('marketLanguage')}
            hint={t('marketHint')}
            name="market"
            variant="cards"
            value={market.code}
            onValueChange={(v) => prefs.setMarket(v as Market['code'])}
          >
            {MARKETS.map((m) => (
              <Radio
                key={m.code}
                value={m.code}
                label={<span lang={m.locale}>{m.name}</span>}
                description={`${m.currency} · ${m.rail}`}
              />
            ))}
          </RadioGroup>
        </Panel>

        <div className="grid content-start gap-6">
          <Panel>
            <RadioGroup
              legend={t('appearance')}
              name="theme"
              variant="cards"
              value={prefs.theme}
              onValueChange={(v) => prefs.setTheme(v as Theme)}
            >
              <Radio value="system" label={t('themeSystem')} />
              <Radio value="light" label={t('themeLight')} />
              <Radio value="dark" label={t('themeDark')} />
            </RadioGroup>
          </Panel>

          <Panel>
            <RadioGroup
              legend={t('tier')}
              hint={t('tierHint')}
              name="tier"
              variant="cards"
              value={prefs.tier}
              onValueChange={(v) => prefs.setTier(v as Tier)}
            >
              <Radio value="personal" label={t('tierPersonal')} description={t('tierPersonalDesc')} />
              <Radio value="private" label={t('tierPrivate')} description={t('tierPrivateDesc')} />
            </RadioGroup>
          </Panel>

          <Panel title={t('privacy')}>
            <Switch
              label={t('hideBalances')}
              description={t('hideBalancesHint')}
              checked={hideBalances}
              onCheckedChange={setHideBalances}
            />
          </Panel>

          <div>
            <Button variant="secondary" onClick={prefs.signOut}>
              <LogOut aria-hidden="true" size={18} />
              {t('signOut')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
