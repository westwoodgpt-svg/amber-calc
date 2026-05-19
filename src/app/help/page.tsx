'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SectionProps {
  id: string
  icon: string
  title: string
  children: React.ReactNode
}

function Section({ id, icon, title, children }: SectionProps) {
  return (
    <div className="card" id={id} style={{ scrollMarginTop: 72 }}>
      <div className="card-title" style={{ fontSize: 17, marginBottom: 20 }}>
        {icon} {title}
      </div>
      {children}
    </div>
  )
}

function Term({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'inline-block',
        fontWeight: 700,
        color: 'var(--amber)',
        fontSize: 14,
        marginBottom: 4,
      }}>
        {term}
      </div>
      <div style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: 14 }}>
        {children}
      </div>
    </div>
  )
}

function Formula({ label, formula, comment }: { label: string; formula: string; comment?: string }) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 10,
      fontFamily: 'monospace',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4, fontFamily: 'inherit' }}>
        {label}
      </div>
      <div style={{ color: 'var(--amber)', fontSize: 15, fontWeight: 600 }}>{formula}</div>
      {comment && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6, fontFamily: 'inherit', fontWeight: 400 }}>
          {comment}
        </div>
      )}
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
      <div style={{
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--amber)',
        color: '#000',
        fontWeight: 700,
        fontSize: 15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {n}
      </div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="alert alert-info" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>
      💡 {children}
    </div>
  )
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="alert alert-error" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>
      ⚠️ {children}
    </div>
  )
}

const TOC = [
  { id: 'overview',      icon: '🟡', label: 'Общий обзор' },
  { id: 'quickstart',    icon: '🚀', label: 'Быстрый старт' },
  { id: 'concepts',      icon: '📐', label: 'Ключевые понятия' },
  { id: 'formulas',      icon: '🔢', label: 'Формулы расчёта' },
  { id: 'items',         icon: '📦', label: 'Справочник позиций' },
  { id: 'distribution',  icon: '⚖️', label: 'Настройка распределения' },
  { id: 'calculator',    icon: '🧮', label: 'Выполнение расчёта' },
  { id: 'history',       icon: '📋', label: 'История и экспорт' },
  { id: 'faq',           icon: '❓', label: 'Частые вопросы' },
]

export default function HelpPage() {
  const [tocOpen, setTocOpen] = useState(false)

  return (
    <>
      <h1 className="page-title">📖 Инструкция по использованию</h1>

      {/* Mobile TOC toggle */}
      <div className="mobile-only" style={{ marginBottom: 16 }}>
        <button
          className="btn btn-ghost"
          style={{ width: '100%' }}
          onClick={() => setTocOpen((v) => !v)}
        >
          {tocOpen ? '▲ Скрыть содержание' : '☰ Содержание'}
        </button>
        {tocOpen && (
          <div className="card" style={{ marginTop: 8, padding: '12px 16px' }}>
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setTocOpen(false)}
                style={{ display: 'block', padding: '6px 0', color: 'var(--amber)', fontSize: 14 }}
              >
                {item.icon} {item.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Desktop sidebar TOC */}
        <div className="desktop-only" style={{ flexShrink: 0, width: 220, position: 'sticky', top: 72 }}>
          <div className="card" style={{ padding: '12px 0' }}>
            <div style={{ padding: '0 16px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Содержание
            </div>
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  display: 'block',
                  padding: '7px 16px',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  transition: 'color 0.15s',
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--amber)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {item.icon} {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── Overview ── */}
          <Section id="overview" icon="🟡" title="Общий обзор">
            <p style={{ marginBottom: 14, lineHeight: 1.7, fontSize: 14 }}>
              <strong>Amber Calc</strong> — калькулятор для распределения партий янтаря по клиентам.
              Программа позволяет задать фиксированные <em>доли</em> для каждой позиции товара,
              а затем при каждой отгрузке автоматически рассчитывает количество мешков/коробок
              с учётом <em>накопительного баланса</em> — то есть переплат и недоплат из прошлых расчётов.
              Баланс ведётся <strong>отдельно для каждой компании</strong>: переплата одного клиента
              не влияет на расчёты другого.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { icon: '📦', title: 'Позиции', desc: 'Справочник товаров с весом упаковки' },
                { icon: '⚖️', title: 'Распределение', desc: 'Доли каждой позиции в 100%' },
                { icon: '🧮', title: 'Калькулятор', desc: 'Расчёт отгрузки на клиента' },
                { icon: '📋', title: 'История', desc: 'Все прошлые расчёты с экспортом' },
              ].map((c) => (
                <div key={c.title} style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Quickstart ── */}
          <Section id="quickstart" icon="🚀" title="Быстрый старт">
            <Step n={1} title="Добавьте позиции товара">
              Перейдите на главную страницу «<Link href="/">Калькулятор</Link>» →
              прокрутите вниз до таблицы «Справочник позиций» → нажмите <strong>+ Добавить позицию</strong>.
              Укажите тип, наименование и <strong>вес упаковки</strong> (кг одного мешка или коробки).
              После добавления нажмите «Подтвердить» у каждой позиции — без подтверждения позиция не участвует в расчётах.
            </Step>
            <Step n={2} title="Настройте распределение">
              Перейдите на страницу «<Link href="/distribution">Распределение</Link>».
              Включите нужные позиции (чекбокс слева) и введите для каждой
              <strong> долю в процентах</strong>. Сумма включённых долей должна быть ровно <strong>100%</strong>.
              Если нет — нажмите «Нормализовать». Сохраните конфигурацию.
            </Step>
            <Step n={3} title="Выполните расчёт">
              Вернитесь на главную. Введите <strong>общий вес отгрузки (кг)</strong>.
              При необходимости включите переключатель «Открыть последний мешок».
              Нажмите <strong>🔢 Рассчитать</strong>, введите название компании — получите таблицу распределения.
            </Step>
            <Step n={4} title="Проверьте и экспортируйте">
              В результате отображается: расчётный вес, количество мешков/коробок,
              фактический вес и отклонение для каждой позиции.
              Нажмите <strong>📥 Экспорт в Excel</strong>, чтобы сохранить расчёт.
            </Step>
            <Tip>
              Все выполненные расчёты автоматически сохраняются в историю и учитываются
              в балансе при следующих расчётах.
            </Tip>
          </Section>

          {/* ── Concepts ── */}
          <Section id="concepts" icon="📐" title="Ключевые понятия">
            <Term term="Позиция (товар)">
              Единица учёта — конкретная фракция янтаря, например «Несортированный +11,5 мм».
              У каждой позиции есть <strong>тип</strong> (Фракционный / Сито) и
              <strong> вес упаковки</strong> — сколько кг в одном мешке или коробке.
              Позиция участвует в расчёте только если её вес <strong>подтверждён</strong>.
            </Term>

            <Term term="Вес упаковки">
              Вес одной физической единицы товара — мешка, коробки, биг-бэга — в килограммах.
              Например: 500 кг (биг-бэг несортированного) или 25 кг (коробка фракционного).
              Именно на это значение округляется каждый расчёт.
            </Term>

            <Term term="Доля">
              Процент от общего веса отгрузки, который должна занимать данная позиция.
              Сумма долей всех <em>включённых</em> позиций в распределении должна равняться ровно <strong>100%</strong>.
              Доли хранятся в базе в виде десятичных дробей (0 … 1), но отображаются в процентах.
            </Term>

            <Term term="Расчётный вес">
              Идеальный вес позиции для данной отгрузки:
              <span style={{ display: 'block', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', margin: '6px 0', fontFamily: 'monospace', color: 'var(--amber)' }}>
                Расч.вес = ОбщийВес × Доля
              </span>
              Это «целевое» значение до учёта упаковки и баланса.
            </Term>

            <Term term="Скорректированный вес">
              Расчётный вес минус накопленный баланс с прошлых отгрузок:
              <span style={{ display: 'block', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', margin: '6px 0', fontFamily: 'monospace', color: 'var(--amber)' }}>
                Скорр.вес = Расч.вес − Баланс
              </span>
              Если в прошлый раз было отгружено <em>больше</em> нормы (баланс &gt; 0),
              скорректированный вес уменьшается — система «возвращает долг».
            </Term>

            <Term term="Количество упаковок">
              Число целых мешков/коробок. Всегда округляется <strong>вверх</strong>:
              <span style={{ display: 'block', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', margin: '6px 0', fontFamily: 'monospace', color: 'var(--amber)' }}>
                Упаковок = ⌈ Скорр.вес / Вес.уп. ⌉
              </span>
              Исключение — режим «открытый мешок»: там последняя упаковка может быть неполной.
            </Term>

            <Term term="Фактический вес">
              Сколько килограмм реально отгружается:
              <span style={{ display: 'block', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', margin: '6px 0', fontFamily: 'monospace', color: 'var(--amber)' }}>
                Факт.вес = Упаковок × Вес.уп.&nbsp;&nbsp;&nbsp;(стандартный режим)<br />
                Факт.вес = Скорр.вес&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(режим «открытый мешок»)
              </span>
            </Term>

            <Term term="Отклонение / Дельта">
              Разница между фактической отгрузкой и расчётным весом:
              <span style={{ display: 'block', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', margin: '6px 0', fontFamily: 'monospace', color: 'var(--amber)' }}>
                Δ = Факт.вес − Расч.вес
              </span>
              <span style={{ color: 'var(--red)' }}>Положительная дельта</span> — отгружено больше нормы
              (переплата, будет вычтена из следующей отгрузки).{' '}
              <span style={{ color: 'var(--green)' }}>Отрицательная</span> — отгружено меньше
              (долг, будет добавлен к следующей).
            </Term>

            <Term term="Накопительный баланс">
              Сумма дельт всех предыдущих расчётов <strong>данной компании</strong> для данной позиции.
              Баланс привязан к компании — переплата одной фирмы не влияет на расчёты другой.
              Система извлекает его автоматически из истории:
              <span style={{ display: 'block', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', margin: '6px 0', fontFamily: 'monospace', color: 'var(--amber)' }}>
                Баланс = Σ Δ (по расчётам этой компании, для данной позиции)
              </span>
              Именно баланс обеспечивает <em>точное</em> долгосрочное соблюдение долей для каждой компании:
              даже если каждый отдельный расчёт округляется до целых мешков,
              суммарно всё сходится к заданным процентам.
            </Term>

            <Term term="Режим «Открыть последний мешок»">
              Специальный режим, при котором последняя упаковка может быть частичной —
              чтобы отгрузить <em>точно</em> нужный вес без остатка.
              В этом режиме <code>Факт.вес = Скорр.вес</code>, дельта = <code>−пред.баланс</code>
              (баланс сбрасывается в ноль). Удобно при финальной отгрузке партии.
            </Term>
          </Section>

          {/* ── Formulas ── */}
          <Section id="formulas" icon="🔢" title="Формулы расчёта">
            <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Все вычисления выполняются по следующей цепочке для каждой позиции:
            </p>
            <Formula
              label="1. Расчётный вес"
              formula="Расч.вес = ОбщийВес × Доля"
              comment="ОбщийВес — общий вес отгрузки (кг), Доля — доля позиции (0…1)"
            />
            <Formula
              label="2. Баланс (накопленный из истории — только эта компания)"
              formula="Баланс = Σ Δi  (по расчётам этой компании)"
              comment="Баланс привязан к компании. Переплата компании А не влияет на компанию Б."
            />
            <Formula
              label="3. Скорректированный вес"
              formula="Скорр.вес = Расч.вес − Баланс"
              comment="Если Скорр.вес ≤ 0 → позиция не отгружается (Упаковок = 0)"
            />
            <Formula
              label="4а. Количество упаковок (стандартный режим)"
              formula="Упаковок = ⌈ Скорр.вес / Вес.уп. ⌉"
              comment="Математическое округление вверх (⌈ ⌉)"
            />
            <Formula
              label="4б. Количество упаковок (открытый мешок)"
              formula="Упаковок = ⌈ Скорр.вес / Вес.уп. ⌉  (для отображения)"
              comment="Но последний мешок неполный — фактически отгружается точный вес"
            />
            <Formula
              label="5а. Фактический вес (стандартный режим)"
              formula="Факт.вес = Упаковок × Вес.уп."
              comment="Всегда кратно весу упаковки"
            />
            <Formula
              label="5б. Фактический вес (открытый мешок)"
              formula="Факт.вес = Скорр.вес"
              comment="Точный вес, последняя упаковка частичная"
            />
            <Formula
              label="6. Дельта (записывается в историю)"
              formula="Δ = Факт.вес − Расч.вес"
              comment="Δ записывается в журнал истории и влияет на будущие балансы компании"
            />

            <div style={{ marginTop: 16 }}>
              <Tip>
                В стандартном режиме дельта почти всегда положительна (округление вверх даёт небольшой
                «излишек»). В режиме «открытый мешок» Δ = <code>−пред.баланс</code>,
                то есть ровно компенсирует накопленный баланс — после расчёта баланс компании обнуляется.
              </Tip>
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginTop: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Пример расчёта</div>
              <div style={{ fontSize: 13, lineHeight: 2, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                <div>Общий вес отгрузки: <span style={{ color: 'var(--text)' }}>1 000 кг</span></div>
                <div>Позиция «Несортированный +11,5 мм», доля: <span style={{ color: 'var(--text)' }}>15.64%</span></div>
                <div>Вес упаковки: <span style={{ color: 'var(--text)' }}>500 кг</span></div>
                <div>Баланс из истории: <span style={{ color: 'var(--text)' }}>+12 кг (прошлый раз отгрузили лишнее)</span></div>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }}>
                  Расч.вес = <span style={{ color: 'var(--amber)' }}>1000 × 0.1564 = 156.4 кг</span>
                </div>
                <div>Скорр.вес = <span style={{ color: 'var(--amber)' }}>156.4 − 12 = 144.4 кг</span></div>
                <div>Упаковок = <span style={{ color: 'var(--amber)' }}>⌈ 144.4 / 500 ⌉ = 1</span></div>
                <div>Факт.вес = <span style={{ color: 'var(--amber)' }}>1 × 500 = 500 кг</span></div>
                <div>Δ = <span style={{ color: 'var(--red)' }}>500 − 156.4 = +343.6 кг</span> → уйдёт в баланс</div>
              </div>
            </div>
          </Section>

          {/* ── Items ── */}
          <Section id="items" icon="📦" title="Справочник позиций">
            <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Справочник расположен на главной странице «Калькулятор» (нижняя часть).
              Позиция — это конкретный вид товара, который входит в отгрузку.
            </p>

            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Добавление позиции</div>
            <ol style={{ fontSize: 14, lineHeight: 2, paddingLeft: 20, color: 'var(--text-muted)', marginBottom: 16 }}>
              <li>Нажмите <strong style={{ color: 'var(--text)' }}>+ Добавить позицию</strong></li>
              <li>Выберите <strong style={{ color: 'var(--text)' }}>Тип</strong>: <em>Фракционный</em> (коробки) или <em>Сито</em> (мешки/биг-бэги)</li>
              <li>Введите <strong style={{ color: 'var(--text)' }}>Наименование</strong> — понятное название для отчётов</li>
              <li>Укажите <strong style={{ color: 'var(--text)' }}>Упаковка (кг)</strong> — вес одного мешка или коробки</li>
              <li>Нажмите <strong style={{ color: 'var(--text)' }}>✓ Добавить</strong></li>
              <li>В таблице нажмите <strong style={{ color: 'var(--amber)' }}>Подтвердить</strong> рядом с новой позицией</li>
            </ol>

            <Warn>
              Позиция не участвует в расчётах, пока вес упаковки не подтверждён.
              Строка в распределении с неподтверждённой позицией тоже блокирует расчёт.
            </Warn>

            <div style={{ fontWeight: 600, marginBottom: 10, marginTop: 16, fontSize: 14 }}>Редактирование</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Нажмите ✏️ в строке позиции. Можно изменить тип, название, вес упаковки
              и статус подтверждения. Если снять галочку «Вес подтверждён»,
              позиция будет исключена из расчётов до повторного подтверждения.
            </p>

            <Tip>
              Удаление позиции из справочника автоматически исключает её из конфигурации распределения.
              История расчётов при этом сохраняется.
            </Tip>
          </Section>

          {/* ── Distribution ── */}
          <Section id="distribution" icon="⚖️" title="Настройка распределения">
            <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Страница «<Link href="/distribution">Распределение</Link>» — это конфигурация
              того, <em>какой процент</em> от общего веса отгрузки идёт на каждую позицию.
            </p>

            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Правила</div>
            <ul style={{ fontSize: 14, lineHeight: 2, paddingLeft: 20, color: 'var(--text-muted)', marginBottom: 16 }}>
              <li>Включайте только позиции, которые должны войти в данную отгрузку (чекбокс)</li>
              <li>Сумма долей <strong style={{ color: 'var(--text)' }}>включённых</strong> позиций должна быть ровно <strong style={{ color: 'var(--amber)' }}>100%</strong></li>
              <li>Выключенные позиции автоматически получают долю 0% и не участвуют в расчёте</li>
              <li>Позиции с неподтверждённым весом упаковки блокируют расчёт даже если они включены</li>
            </ul>

            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Кнопка «Нормализовать до 100%»</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
              Если сумма долей не равна 100%, кнопка <strong>Нормализовать</strong> автоматически
              пересчитает все доли пропорционально, чтобы их сумма стала ровно 100%.
              Относительные пропорции между позициями при этом сохранятся.
            </p>

            <Tip>
              При добавлении новой позиции в справочник она появляется в распределении
              с нулевой долей и выключенной. Включите её вручную и задайте долю.
            </Tip>
            <Tip>
              Конфигурация распределения одна и та же для всех расчётов. Если нужно сделать
              расчёт с другим набором позиций — временно измените доли, рассчитайте, затем верните обратно.
            </Tip>
          </Section>

          {/* ── Calculator ── */}
          <Section id="calculator" icon="🧮" title="Выполнение расчёта">
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Параметры расчёта</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 16, color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: 8 }}>
                <strong style={{ color: 'var(--text)' }}>Общий вес отгрузки (кг)</strong> —
                сколько килограмм янтаря нужно отгрузить данному клиенту.
                Это входное число для всех формул.
              </p>
              <p>
                <strong style={{ color: 'var(--text)' }}>Открыть последний мешок</strong> —
                переключатель режима упаковки.
                <br />
                🔴 <em>Выключено (по умолчанию)</em>: отгружаются только целые мешки/коробки.
                Вес немного превышает расчётный, разница уходит в баланс.
                <br />
                🟢 <em>Включено</em>: последняя упаковка может быть частичной —
                отгружается ровно столько, сколько нужно. Баланс обнуляется.
              </p>
            </div>

            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Процесс расчёта</div>
            <ol style={{ fontSize: 14, lineHeight: 2, paddingLeft: 20, color: 'var(--text-muted)', marginBottom: 16 }}>
              <li>Убедитесь, что в блоке «Параметры расчёта» отображается <span style={{ color: 'var(--green)' }}>✓ Распределение: N позиций, сумма долей 100%</span></li>
              <li>Убедитесь, что нет предупреждений о неподтверждённых весах</li>
              <li>Введите общий вес отгрузки</li>
              <li>Нажмите <strong style={{ color: 'var(--text)' }}>🔢 Рассчитать</strong></li>
              <li>Введите <strong style={{ color: 'var(--text)' }}>название компании или клиента</strong> → подтвердите Enter или кнопкой</li>
            </ol>

            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Результат расчёта</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
              Таблица показывает для каждой позиции:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
              {[
                { col: 'Доля %',        desc: 'Заданный процент в распределении' },
                { col: 'Расч. вес',     desc: 'ОбщийВес × Доля' },
                { col: 'Скорректир.',   desc: 'Расч.вес − Баланс' },
                { col: 'Упаковка',      desc: 'Вес одного мешка/коробки' },
                { col: 'Кол-во',        desc: 'Число мешков/коробок' },
                { col: 'Факт',          desc: 'Реально отгружается' },
                { col: 'Откл.',         desc: 'Дельта = факт − расчёт' },
              ].map((c) => (
                <div key={c.col} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: 2 }}>{c.col}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{c.desc}</div>
                </div>
              ))}
            </div>

            <Warn>
              Расчёт сразу сохраняется в историю и влияет на баланс следующих расчётов.
              Если нужно «отменить» — удалите запись из страницы «История».
            </Warn>
          </Section>

          {/* ── History ── */}
          <Section id="history" icon="📋" title="История и экспорт">
            <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Страница «<Link href="/history">История</Link>» хранит все выполненные расчёты.
              Каждая запись содержит компанию, дату, общий вес, фактический вес и отклонение.
            </p>

            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Экспорт расчёта в Excel</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
              Нажмите <strong>📥 Excel</strong> рядом с нужным расчётом (или прямо на странице результата)
              — скачивается файл с полной таблицей позиций: расч. вес, мешки, факт, дельта.
              Имя файла содержит дату и название компании.
            </p>

            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Удаление расчёта</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
              Нажмите 🗑 напротив записи и подтвердите удаление.
              При удалении расчёт помечается как удалённый и <strong>исключается из баланса</strong> —
              то есть его дельты перестают влиять на будущие расчёты этой компании.
            </p>
            <Warn>
              Удаляйте только самый последний расчёт компании. Если удалить более ранний,
              последующие расчёты этой же компании окажутся некорректными — они были рассчитаны
              с учётом баланса удалённой записи. Система предупредит, если выбранный расчёт не последний.
            </Warn>

            <Tip>
              Сразу после выполнения расчёта кнопка «📥 Экспорт в Excel» доступна прямо
              в блоке результата на главной странице — не нужно переходить в историю.
            </Tip>
          </Section>

          {/* ── FAQ ── */}
          <Section id="faq" icon="❓" title="Частые вопросы">
            {[
              {
                q: 'Почему кнопка «Рассчитать» недоступна?',
                a: 'Проверьте: (1) введён ли общий вес, (2) настроено ли распределение — сумма долей 100%, (3) подтверждены ли веса упаковки у всех включённых позиций. Все проблемы отображаются в блоке «Параметры расчёта» на главной.',
              },
              {
                q: 'Баланс общий для всех или отдельный для каждой компании?',
                a: 'Баланс привязан к компании. Если компания А получила лишних 491 кг +16мм (из-за округления до целого мешка 500 кг), только у компании А следующий расчёт скомпенсирует это — компания Б начинает со своего чистого баланса. При вводе названия компании подсказывается, первый ли это расчёт или баланс уже накоплен.',
              },
              {
                q: 'Что значит «(неполный)» рядом с позицией в результате?',
                a: 'Это метка режима «Открыть последний мешок»: последняя упаковка для этой позиции частичная — отгружается меньше, чем вес упаковки. Физически нужно взять мешок/коробку и отсыпать/отвесить нужное количество.',
              },
              {
                q: 'Как сбросить баланс (начать с нуля)?',
                a: 'Удалите все записи в истории — это обнулит накопленные дельты. Или используйте режим «Открыть последний мешок» для финального расчёта: он отгружает ровно нужный вес и обнуляет баланс для каждой позиции.',
              },
              {
                q: 'Можно ли иметь несколько конфигураций распределения?',
                a: 'В текущей версии конфигурация одна — «активная». Чтобы сменить набор позиций, отредактируйте страницу «Распределение» и сохраните.',
              },
              {
                q: 'Почему фактический вес больше запрошенного?',
                a: 'Потому что система округляет вверх до целых упаковок. Например, если нужно 144 кг, а мешок весит 500 кг — отгружается 1 мешок = 500 кг. Разница +356 кг уходит в баланс и уменьшит следующую отгрузку.',
              },
              {
                q: 'Можно ли изменить вес упаковки у уже используемой позиции?',
                a: 'Да. Откройте редактирование позиции (✏️), измените вес упаковки и сохраните. Новый вес будет применён ко всем будущим расчётам. Исторические расчёты не пересчитываются.',
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                style={{
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 12,
                  marginBottom: 12,
                }}
              >
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '4px 0',
                  listStyle: 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}>
                  <span style={{ color: 'var(--amber)', flexShrink: 0 }}>▶</span>
                  {q}
                </summary>
                <div style={{
                  marginTop: 10,
                  marginLeft: 20,
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                }}>
                  {a}
                </div>
              </details>
            ))}
          </Section>

        </div>
      </div>
    </>
  )
}
