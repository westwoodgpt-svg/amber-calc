'use client'

import { useState } from 'react'
import Link from 'next/link'

function Section({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card" id={id} style={{ scrollMarginTop: 72 }}>
      <div className="card-title" style={{ fontSize: 17, marginBottom: 20 }}>{icon} {title}</div>
      {children}
    </div>
  )
}

function Term({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, color: 'var(--amber)', fontSize: 14, marginBottom: 4 }}>{term}</div>
      <div style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: 14 }}>{children}</div>
    </div>
  )
}

function Formula({ label, formula, comment }: { label: string; formula: string; comment?: string }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', marginBottom: 10, fontFamily: 'monospace' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4, fontFamily: 'inherit' }}>{label}</div>
      <div style={{ color: 'var(--amber)', fontSize: 15, fontWeight: 600 }}>{formula}</div>
      {comment && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6, fontFamily: 'inherit', fontWeight: 400 }}>{comment}</div>}
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
      <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: 'var(--amber)', color: '#000', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="alert alert-info" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>💡 {children}</div>
}

function Warn({ children }: { children: React.ReactNode }) {
  return <div className="alert alert-error" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>⚠️ {children}</div>
}

const TOC = [
  { id: 'overview',    icon: '🟡', label: 'Как это работает' },
  { id: 'quickstart',  icon: '🚀', label: 'Быстрый старт' },
  { id: 'concepts',    icon: '📐', label: 'Ключевые понятия' },
  { id: 'formulas',    icon: '🔢', label: 'Формулы' },
  { id: 'orders',      icon: '📋', label: 'Заявки' },
  { id: 'calculator',  icon: '🧮', label: 'Калькулятор' },
  { id: 'exclusions',  icon: '🚫', label: 'Исключения позиций' },
  { id: 'newyear',     icon: '📅', label: 'Новый год' },
  { id: 'history',     icon: '🗂️', label: 'История' },
  { id: 'faq',         icon: '❓', label: 'Частые вопросы' },
]

export default function HelpPage() {
  const [tocOpen, setTocOpen] = useState(false)

  return (
    <>
      <h1 className="page-title">📖 Инструкция</h1>

      <div className="mobile-only" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setTocOpen((v) => !v)}>
          {tocOpen ? '▲ Скрыть содержание' : '☰ Содержание'}
        </button>
        {tocOpen && (
          <div className="card" style={{ marginTop: 8, padding: '12px 16px' }}>
            {TOC.map((item) => (
              <a key={item.id} href={`#${item.id}`} onClick={() => setTocOpen(false)} style={{ display: 'block', padding: '6px 0', color: 'var(--amber)', fontSize: 14 }}>
                {item.icon} {item.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Desktop sidebar */}
        <div className="desktop-only" style={{ flexShrink: 0, width: 200, position: 'sticky', top: 72 }}>
          <div className="card" style={{ padding: '12px 0' }}>
            <div style={{ padding: '0 16px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Содержание</div>
            {TOC.map((item) => (
              <a key={item.id} href={`#${item.id}`} style={{ display: 'block', padding: '7px 16px', fontSize: 13, color: 'var(--text-muted)', transition: 'color 0.15s', lineHeight: 1.4 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--amber)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                {item.icon} {item.label}
              </a>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── Overview ── */}
          <Section id="overview" icon="🟡" title="Как это работает">
            <p style={{ marginBottom: 14, lineHeight: 1.7, fontSize: 14 }}>
              <strong>Amber Calc</strong> планирует 5 равных отгрузок янтаря в год для каждого клиента.
              Клиент заказывает определённое количество кг категорий <strong>ВЕС</strong> (весовые фракции),
              <strong> СИТО</strong> (несортированный фракционный) и/или <strong>ЛАК</strong> (чёрный лак).
              Система делит годовой объём на 5 отгрузок и распределяет внутри каждой категории
              пропорционально <em>составу лота</em> — долям позиций в партии.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
              {[
                { icon: '📋', href: '/orders',  title: 'Заявки',       desc: 'Годовой заказ кг по категориям' },
                { icon: '🧮', href: '/',         title: 'Калькулятор',  desc: 'Планируете и выполняете 5 отгрузок' },
                { icon: '📦', href: '/lot',      title: 'Состав лота',  desc: 'Справочник позиций и их доли' },
                { icon: '🗂️', href: '/history', title: 'История',      desc: 'Все выполненные расчёты' },
              ].map((c) => (
                <Link key={c.href} href={c.href} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', height: '100%' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--amber)' }}>{c.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Схема работы за год:</div>
              <div style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--amber)' }}>1.</span> Внести годовые заявки клиентов (сколько кг каждой категории) →{' '}
                <span style={{ color: 'var(--amber)' }}>2.</span> Открыть калькулятор, выбрать компанию →{' '}
                <span style={{ color: 'var(--amber)' }}>3.</span> Система покажет план на 5 отгрузок →{' '}
                <span style={{ color: 'var(--amber)' }}>4.</span> Нажать «Выполнить №1» перед первой отгрузкой — расчёт записывается →{' '}
                <span style={{ color: 'var(--amber)' }}>5.</span> Повторить для отгрузок №2–5. Отгрузка №5 — «выход в ноль»: погашает все накопленные дельты.
              </div>
            </div>
          </Section>

          {/* ── Quickstart ── */}
          <Section id="quickstart" icon="🚀" title="Быстрый старт">
            <Step n={1} title="Добавьте заявки клиентов">
              Перейдите на страницу «<Link href="/orders">Заявки</Link>». Для каждой компании укажите
              годовой объём в кг: <strong>ВЕС</strong> (весовая сортировка, упаковки ~10 кг),
              <strong> СИТО</strong> (несортированный, мешки ~25 кг),
              <strong> ЛАК</strong> (чёрный лак, коробки ~10 кг). Нули означают, что категория не нужна клиенту.
            </Step>
            <Step n={2} title="Откройте калькулятор">
              На главной странице «<Link href="/">Калькулятор</Link>» введите название компании
              в строку поиска — система подтянет заявку и покажет <strong>план 5 отгрузок</strong>
              с расчётными весами и прогнозом на каждую позицию.
            </Step>
            <Step n={3} title="Выполните отгрузку">
              Разверните нужную строку отгрузки (клик по ней) — увидите подробную таблицу позиций.
              Когда товар реально готов к отправке — нажмите <strong>🚀 №N</strong>.
              Расчёт записывается в базу, баланс обновляется.
            </Step>
            <Step n={4} title="Повторяйте до отгрузки №5">
              Каждая следующая отгрузка учитывает реальный баланс предыдущих.
              Отгрузка №5 (последняя) автоматически работает в режиме «выход в ноль»:
              каждая позиция получает ровно то, что недобрала/переплатила — итого за год = заявка.
            </Step>
            <Tip>
              Кнопка «Выполнить» появляется только у следующей по порядку отгрузки.
              Пропустить нельзя — нужно строго по порядку: №1, №2 … №5.
            </Tip>
          </Section>

          {/* ── Concepts ── */}
          <Section id="concepts" icon="📐" title="Ключевые понятия">
            <Term term="Категории: ВЕС / СИТО / ЛАК">
              Три независимые группы товара. Расчёт внутри каждой категории выполняется отдельно.
              ВЕС — весовые фракции в коробках ~10 кг (52 позиции).
              СИТО — несортированный фракционный в мешках ~25 кг (7 позиций).
              ЛАК — чёрный лак в коробках ~10 кг (4 позиции).
            </Term>
            <Term term="Состав лота">
              Каждая позиция имеет <strong>вес в лоте</strong> (lotKg) — сколько кг этой фракции
              в общей партии. Доля позиции = её lotKg / сумма lotKg по категории.
              Это постоянная величина, одинаковая для всех компаний.
              Посмотреть: <Link href="/lot">страница «Состав лота»</Link>.
            </Term>
            <Term term="Расчётный вес на одну отгрузку">
              <span style={{ display: 'block', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', margin: '6px 0', fontFamily: 'monospace', color: 'var(--amber)' }}>
                Расч.вес = (Годовой_заказ_категории / 5) × (lotKg_позиции / totalLot_категории)
              </span>
              Это идеальное количество, которое клиент должен получить за одну отгрузку.
            </Term>
            <Term term="Накопительный баланс">
              Разница между фактически отгруженным и расчётным весом, накопленная по всем
              предыдущим отгрузкам <strong>данного клиента</strong>. Баланс у каждой компании свой —
              переплата одного клиента не влияет на другого.
              <span style={{ display: 'block', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', margin: '6px 0', fontFamily: 'monospace', color: 'var(--amber)' }}>
                Δ = Факт − Расч.вес → накапливается в балансе
              </span>
            </Term>
            <Term term="Скорректированный вес">
              Расч.вес минус накопленный баланс — то, что нужно отгрузить с учётом переплат:
              <span style={{ display: 'block', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', margin: '6px 0', fontFamily: 'monospace', color: 'var(--amber)' }}>
                Скорр.вес = Расч.вес − Баланс
              </span>
              Если в прошлый раз отгрузили лишнее (Δ &gt; 0), следующая отгрузка уменьшается.
            </Term>
            <Term term="Порог полупачки">
              Если скорр.вес &lt; половины упаковки — позицию в эту отгрузку НЕ кладут.
              Баланс накапливается до следующей отгрузки, когда наберётся достаточно.
              Это защита от ситуации «Math.ceil(0.05 кг / 10 кг) = 1 ящик» — явного перерасхода.
            </Term>
            <Term term="Отгрузка №5 — «выход в ноль»">
              Последняя отгрузка работает в режиме частичной упаковки: каждая позиция получает
              <em> ровно</em> скорр.вес (без округления до целых ящиков). Это обнуляет баланс
              и обеспечивает, что за 5 отгрузок клиент суммарно получит ровно годовой заказ.
            </Term>
          </Section>

          {/* ── Formulas ── */}
          <Section id="formulas" icon="🔢" title="Формулы расчёта">
            <Formula label="Целевой вес за одну отгрузку" formula="target = annualKg / 5" />
            <Formula label="Доля позиции внутри категории" formula="share = lotKg / totalLot" />
            <Formula label="Расчётный вес" formula="calcWeight = target × share" />
            <Formula label="Скорректированный вес" formula="adj = calcWeight − balance" comment="balance = Σ Δi из всех предыдущих отгрузок этой компании" />
            <Formula
              label="Стандартный режим (отгрузки №1–4)"
              formula="если adj ≤ 0 → 0 пачек · если adj < pack/2 → 0 пачек · иначе → ⌈adj/pack⌉ пачек"
              comment="Округление вверх до целых упаковок. Если меньше половины упаковки — позиция пропускается."
            />
            <Formula
              label="Режим выхода в ноль (отгрузка №5)"
              formula="factWeight = adj  (без округления)"
              comment="Точное количество кг, последняя упаковка может быть неполной."
            />
            <Formula label="Дельта (пишется в историю и баланс)" formula="Δ = factWeight − calcWeight" />

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginTop: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Пример — ООО Балтийская волна, позиция 9911300ПП</div>
              <div style={{ fontSize: 13, lineHeight: 2.1, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                <div>Годовой заказ ВЕС: <span style={{ color: 'var(--text)' }}>400 кг</span> → per ship: <span style={{ color: 'var(--amber)' }}>80 кг</span></div>
                <div>lotKg позиции: <span style={{ color: 'var(--text)' }}>2 070 / 9 974</span> → share: <span style={{ color: 'var(--amber)' }}>20.75%</span></div>
                <div>calcWeight = 80 × 0.2075 = <span style={{ color: 'var(--amber)' }}>16.60 кг</span></div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
                  Отг.1: balance=0, adj=16.60, ящик=10кг → 2 ящика = 20кг, Δ=<span style={{ color: 'var(--red)' }}>+3.4</span>
                </div>
                <div>Отг.2: balance=+3.4, adj=13.2, → 2 ящика = 20кг, Δ=<span style={{ color: 'var(--red)' }}>+3.4</span></div>
                <div>Отг.3: balance=+6.8, adj=9.8, → 1 ящик = 10кг, Δ=<span style={{ color: 'var(--green)' }}>−6.6</span></div>
                <div>Отг.4: balance=+0.2, adj=16.4, → 2 ящика = 20кг, Δ=<span style={{ color: 'var(--red)' }}>+3.4</span></div>
                <div>Отг.5 (выход в ноль): balance=+3.6, adj=13.0 → <span style={{ color: 'var(--amber)' }}>13.0 кг точно</span>, Δ≈0</div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4, color: 'var(--green)' }}>
                  Итого: 20+20+10+20+13 = 83 кг ≈ 80 кг × 5/5 (+3 кг погрешность дискретизации)
                </div>
              </div>
            </div>
          </Section>

          {/* ── Orders ── */}
          <Section id="orders" icon="📋" title="Страница «Заявки»">
            <p style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Страница «<Link href="/orders">Заявки</Link>» — это основной справочник: кто, что и сколько заказал.
            </p>
            <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 16, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>Год</strong> — фильтр по году. Заявки хранятся отдельно за каждый год.
              По умолчанию показывается текущий год (2026).
              <br />
              <strong style={{ color: 'var(--text)' }}>Скопировать в N+1 год</strong> — кнопка создаёт копии всех заявок и исключений на следующий год
              (пропускает уже существующие). Используйте в начале года.
              <br />
              <strong style={{ color: 'var(--text)' }}>ВЕС / СИТО / ЛАК</strong> — годовой объём кг по каждой категории. Если 0 — категория клиенту не нужна.
              <br />
              <strong style={{ color: 'var(--text)' }}>🚫 (кнопка исключений)</strong> — открывает панель, где можно снять галочки с отдельных позиций.
              Их доля будет перераспределена между остальными.
            </div>
            <Tip>
              Чтобы изменить заявку — нажмите ✏️ в строке, измените цифры, сохраните.
              После изменения заявки все <em>плановые</em> (невыполненные) отгрузки пересчитываются автоматически.
            </Tip>
          </Section>

          {/* ── Calculator ── */}
          <Section id="calculator" icon="🧮" title="Страница «Калькулятор»">
            <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>Выбор компании</strong> — начните вводить название, список компаний подсказывает.
              При выборе автоматически загружается план 5 отгрузок.
            </div>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Строка отгрузки</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
              {[
                { icon: '✓', label: 'Выполнена', desc: 'Отгрузка записана в базу, баланс зафиксирован' },
                { icon: '○', label: 'Плановая', desc: 'Прогноз на основе текущего баланса' },
                { icon: '🚀 №N', label: 'Кнопка выполнения', desc: 'Только у следующей по порядку отгрузки' },
                { icon: 'ожидает', label: 'Заблокирована', desc: 'Нельзя пропустить — сначала выполните предыдущую' },
              ].map((c) => (
                <div key={c.label} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: 2, fontFamily: 'monospace' }}>{c.icon}</div>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{c.label}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{c.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Таблица позиций (развернуть строку)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 14 }}>
              {[
                { col: 'Доля%',      desc: 'lotKg / totalLot' },
                { col: 'Расч.вес',   desc: 'target × share' },
                { col: 'Скорр.',     desc: 'Расч.вес − баланс' },
                { col: 'Уп. кг',     desc: 'Вес одной упаковки' },
                { col: 'Кол-во',     desc: 'Число ящиков/мешков' },
                { col: 'Факт',       desc: 'Реально отгружается' },
                { col: 'Δ',          desc: 'Факт − Расч.вес → в баланс' },
              ].map((c) => (
                <div key={c.col} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: 2 }}>{c.col}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{c.desc}</div>
                </div>
              ))}
            </div>
            <Warn>
              Нажатие «🚀 №N» сразу записывает отгрузку в базу и влияет на последующий баланс.
              Если нужно отменить — удалите запись на странице «<Link href="/history">История</Link>»
              (только последнюю по этой компании, иначе последующие расчёты станут некорректными).
            </Warn>
            <Tip>
              Если у компании нет заявки, страница покажет ошибку со ссылкой — перейдите в
              «<Link href="/orders">Заявки</Link>» и добавьте запись.
            </Tip>
          </Section>

          {/* ── Exclusions ── */}
          <Section id="exclusions" icon="🚫" title="Исключения позиций">
            <p style={{ marginBottom: 14, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Некоторым клиентам нужны не все позиции внутри категории — например, только крупные
              фракции. На странице «<Link href="/orders">Заявки</Link>» нажмите кнопку 🚫 рядом
              с компанией — откроется панель со списком позиций.
            </p>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-muted)', marginBottom: 14 }}>
              <strong style={{ color: 'var(--text)' }}>Снять галочку</strong> — позиция исключена.
              Её вес в лоте убирается из суммарного, и доли оставшихся позиций автоматически
              пересчитываются (без изменения цифры в заявке). Например, если убрать позицию с долей 5%,
              оставшиеся 95% нормируются до 100%.
            </div>
            <Tip>
              Исключения хранятся отдельно для каждого года. При копировании заявок в новый год
              (кнопка «Скопировать в N+1») исключения копируются автоматически.
            </Tip>
            <Warn>
              Не путайте исключение и нулевую заявку. Нулевая заявка по категории означает, что
              категория клиенту не нужна вовсе. Исключение позиции — это «из нужной категории
              убрать конкретные фракции».
            </Warn>
          </Section>

          {/* ── New year ── */}
          <Section id="newyear" icon="📅" title="Переход на новый год">
            <Step n={1} title="Убедитесь, что все 5 отгрузок за текущий год выполнены">
              Откройте калькулятор по каждой компании и убедитесь, что статус всех отгрузок — «Выполнена».
              Отгрузка №5 (выход в ноль) обнулит накопленные дельты.
            </Step>
            <Step n={2} title="Перейдите на страницу «Заявки» и скопируйте в следующий год">
              Убедитесь, что выбран текущий год. Нажмите <strong>«📋 Скопировать в N+1 год»</strong>.
              Система создаст копии всех заявок и исключений на следующий год.
              Уже существующие записи не перезаписываются.
            </Step>
            <Step n={3} title="Откорректируйте заявки на новый год">
              Переключитесь на новый год в фильтре. Измените объёмы для тех компаний,
              чьи заказы изменились. Добавьте новых клиентов, удалите ушедших.
            </Step>
            <Step n={4} title="Начинайте отгрузки нового года">
              На новый год баланс начинается с нуля (старые выполненные расчёты не влияют,
              так как они привязаны к конкретным записям расчёта). Первая отгрузка нового года
              рассчитывается «чисто».
            </Step>
            <Warn>
              Если отгрузки прошлого года не завершены (есть незаписанные) — переходить на новый год
              не рекомендуется. Плановые (незаписанные) отгрузки прошлого года не влияют на баланс.
            </Warn>
          </Section>

          {/* ── History ── */}
          <Section id="history" icon="🗂️" title="История расчётов">
            <p style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Страница «<Link href="/history">История</Link>» хранит все записанные отгрузки.
              Нажмите на запись — откроется модальное окно с полной таблицей позиций. Там же кнопка экспорта в Excel.
            </p>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-muted)', marginBottom: 14 }}>
              <strong style={{ color: 'var(--text)' }}>Удаление</strong> — кнопка 🗑 мягко удаляет запись (помечает как удалённую).
              Удалённый расчёт исключается из баланса. Система предупредит, если удаляемый расчёт
              не последний для данной компании — это опасно, т.к. последующие расчёты
              были выполнены с учётом удаляемого баланса.
            </div>
            <Warn>
              Удаляйте только <strong>самый последний</strong> расчёт компании. Удаление более раннего
              сделает все последующие расчёты этой компании некорректными.
            </Warn>
          </Section>

          {/* ── FAQ ── */}
          <Section id="faq" icon="❓" title="Частые вопросы">
            {[
              {
                q: 'Почему отгрузка №5 доставляет намного больше kg, чем остальные?',
                a: 'Отгрузка №5 работает в режиме «выход в ноль» и доставляет весь накопленный долг по позициям, которые пропускались в предыдущих отгрузках (у них был скорр.вес < половины упаковки). Это нормально — суммарно за 5 отгрузок клиент получает ровно годовой объём.',
              },
              {
                q: 'Почему некоторые позиции не попадают в отгрузки №1–4?',
                a: 'Срабатывает порог полупачки: если скорр.вес < 5 кг (для упаковки 10 кг), позицию в эту отгрузку не кладут — иначе клиент получил бы 10 кг вместо, например, 0.05 кг. Баланс накапливается, и позиция попадёт в следующую отгрузку (или в №5 — точным весом).',
              },
              {
                q: 'Баланс общий для всех компаний или отдельный?',
                a: 'Баланс строго индивидуален для каждой компании. Переплата компании А не влияет на расчёты компании Б. Историческая дельта загружается из таблицы CalculationHistory по фильтру companyName.',
              },
              {
                q: 'Как изменить годовую заявку уже в середине года (часть отгрузок уже выполнена)?',
                a: 'Откройте страницу «Заявки», нажмите ✏️ и измените цифры. Уже выполненные отгрузки не пересчитываются (их баланс зафиксирован). Плановые отгрузки пересчитаются автоматически при следующем открытии калькулятора.',
              },
              {
                q: 'Что если клиент хочет только крупные фракции ВЕС?',
                a: 'Используйте исключения: на странице «Заявки» нажмите 🚫 рядом с компанией, снимите галочки с нежелательных позиций. Их доля перераспределится на оставшиеся.',
              },
              {
                q: 'Можно ли откатить выполненную отгрузку?',
                a: 'Да — перейдите в «Историю», найдите запись этой компании и удалите её (🗑). Удалять рекомендуется только самую последнюю запись компании. После удаления можно перезаписать отгрузку заново через калькулятор.',
              },
              {
                q: 'Почему итоговый вес за год немного отличается от заявки (погрешность ~1–3 кг)?',
                a: 'Это неустранимая дискретность упаковки: если позиции с малым расч.весом в S4 наконец-то достигают порога и получают ящик 10 кг (при плановых 7 кг), небольшой «излишек» остаётся в балансе. Отгрузка №5 частично компенсирует это, но полностью убрать погрешность без дробных упаковок невозможно.',
              },
            ].map(({ q, a }) => (
              <details key={q} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: '4px 0', listStyle: 'none', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--amber)', flexShrink: 0 }}>▶</span>
                  {q}
                </summary>
                <div style={{ marginTop: 10, marginLeft: 20, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{a}</div>
              </details>
            ))}
          </Section>

        </div>
      </div>
    </>
  )
}
