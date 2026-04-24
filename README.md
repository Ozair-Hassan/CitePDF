# CitePDF

Reading PDFs in a browser is fine. Linking your UI to specific passages in them is not. CitePDF makes that part easy.

![React](https://img.shields.io/badge/React-18%2B-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue) ![License](https://img.shields.io/badge/license-MIT-green)

**[Live demo →](https://cite-pdf-demo.vercel.app/)**

---

## Install

```bash
npm install citepdf pdfjs-dist
```

CitePDF requires these peer dependencies — you must install them yourself:

| Peer dependency | Required version |
| --------------- | ---------------- |
| `react`         | >=18.0.0         |
| `react-dom`     | >=18.0.0         |
| `pdfjs-dist`    | >=4.0.0          |

> **Note:** `pdfjs-dist` is not auto-installed with citepdf. If you skip it you will get a
> `citepdf could not be resolved` error when Vite starts.

---

## Quick start

Pass a PDF and an array of citations. CitePDF finds the text in the document, draws the highlights, and wires up the sidebar for you.

```tsx
import { CitationViewer } from 'citepdf'
import type { Citation, Theme } from 'citepdf'

const citations: Citation[] = [
  {
    id: 1,
    label: 'Key finding',
    page: 3,
    text: 'Overall accuracy improved by 12%.',
  },
  {
    id: 2,
    label: 'Methodology',
    text: 'We sampled 500 participants over six months.',
  },
]

export function MyPage({ theme = 'light' }: { theme?: Theme }) {
  return (
    <CitationViewer
      file="/paper.pdf"
      citations={citations}
      onCitationClick={(id) => console.log('clicked', id)}
      theme={theme}
    />
  )
}
```

---

## Three ways to use it

### 1. Just drop it in

The default `<CitationViewer>` comes with a sidebar, navigation bar, and highlights out of the box. Good for getting something on screen fast.

```tsx
import { CitationViewer } from 'citepdf'
;<CitationViewer
  file="/paper.pdf"
  citations={citations}
  initialPage={1}
  theme="dark"
  highlightColor="rgba(250,204,21,0.4)"
  activeHighlightColor="rgba(59,130,246,0.28)"
  classNames={{
    container: 'my-viewer',
    sidebar: 'my-sidebar',
    navBar: 'my-nav',
  }}
  styles={{
    pdfArea: { backgroundColor: '#1e1e2e' },
    sidebar: { width: '280px' },
  }}
  onCitationClick={(id) => console.log('active citation', id)}
  onPageChange={(page) => console.log('page', page)}
/>
```

---

### 2. Bring your own UI

Hide the built-in sidebar and nav with `hideSidebar` and `hideNav`, grab a ref, and drive the viewer yourself. Useful when you have your own toolbar or you're hooking it up to an AI response card.

```tsx
import { useRef } from 'react'
import { CitationViewer } from 'citepdf'
import type { CitationViewerHandle, Citation, Theme } from 'citepdf'

export function HeadlessExample({ theme = 'dark' }: { theme?: Theme }) {
  const ref = useRef<CitationViewerHandle>(null)
  const [activeCitation, setActiveCitation] = useState<number | null>(null)

  function jumpTo(id: number) {
    setActiveCitation(id)
    ref.current?.setActiveCitation(id)
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside>
        {citations.map((c) => (
          <button
            key={c.id}
            onClick={() => jumpTo(c.id)}
          >
            {c.label}
          </button>
        ))}
        <button onClick={() => ref.current?.jumpToPage(1)}>Go to p.1</button>
        <button onClick={() => ref.current?.clearActiveCitation()}>
          Clear
        </button>
      </aside>

      <CitationViewer
        ref={ref}
        file="/paper.pdf"
        citations={citations}
        hideSidebar
        hideNav
        onCitationClick={(id) => setActiveCitation(id)}
        onPageChange={(page) => console.log(page)}
        theme={theme}
      />
    </div>
  )
}
```

---

### 3. Wire up the pieces yourself

If you need the PDF renderer inside a grid, or the sidebar somewhere else entirely in the DOM, you can import the three sub-components separately and arrange them however you want.

```tsx
import { useState, useRef } from 'react'
import { PDFRenderer, CitationSidebar, NavigationBar } from 'citepdf'
import type { PDFRendererHandle, Theme } from 'citepdf'

export function ComposedExample({ theme = 'dark' }: { theme?: Theme }) {
  const rendererRef = useRef<PDFRendererHandle>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [activeId, setActiveId] = useState<number | undefined>()

  return (
    <div
      style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh' }}
    >
      <NavigationBar
        currentPage={page}
        totalPages={total}
        scale={scale}
        onPageChange={(p) => rendererRef.current?.jumpToPage(p)}
        onScaleChange={setScale}
      />

      <div style={{ display: 'flex', overflow: 'hidden' }}>
        <PDFRenderer
          ref={rendererRef}
          file="/paper.pdf"
          scale={scale}
          citations={citations}
          activeCitationId={activeId}
          highlightColor="rgba(234,179,8,0.35)"
          onDocumentLoaded={(n) => setTotal(n)}
          onVisiblePageChange={setPage}
        />

        <CitationSidebar
          citations={citations}
          activeCitationId={activeId}
          onCitationClick={(id) => {
            setActiveId(id)
            rendererRef.current?.setActiveCitation(id)
          }}
          style={{ width: '260px' }}
        />
      </div>
    </div>
  )
}
```

---

## CitationViewer props

### Core

| Prop          | Type                   | Default      | Description                                         |
| ------------- | ---------------------- | ------------ | --------------------------------------------------- |
| `file`        | `string \| Uint8Array` | **required** | URL, blob URL, or raw bytes of the PDF.             |
| `citations`   | `Citation[]`           | `[]`         | The citations to highlight and list in the sidebar. |
| `initialPage` | `number`               | `1`          | Which page to open on.                              |
| `theme`       | `'light' \| 'dark'`    | `'light'`    | Light or dark chrome.                               |

### Appearance

| Prop                   | Type             | Default                 | Description                                                             |
| ---------------------- | ---------------- | ----------------------- | ----------------------------------------------------------------------- |
| `highlightColor`       | `string`         | `rgba(250,204,21,0.4)`  | Color for inactive highlights.                                          |
| `activeHighlightColor` | `string`         | `rgba(59,130,246,0.28)` | Color for the selected citation.                                        |
| `classNames`           | `ClassNames`     | `{}`                    | Add your own classes to `container`, `pdfArea`, `sidebar`, or `navBar`. |
| `styles`               | `StyleOverrides` | `{}`                    | Inline style overrides for the same four elements.                      |

### Layout

| Prop          | Type      | Default | Description                |
| ------------- | --------- | ------- | -------------------------- |
| `hideSidebar` | `boolean` | `false` | Hide the built-in sidebar. |
| `hideNav`     | `boolean` | `false` | Hide the built-in nav bar. |

### Callbacks

| Prop              | Type                     | Description                                           |
| ----------------- | ------------------------ | ----------------------------------------------------- |
| `onCitationClick` | `(id: number) => void`   | A citation was clicked in the sidebar or on the page. |
| `onPageChange`    | `(page: number) => void` | The visible page changed.                             |

---

## Citation model

```ts
interface Citation {
  id: number
  label?: string
  text: string
  page?: number
}
```

CitePDF searches the PDF's text layer for `text` and figures out where to draw the highlight automatically.

---

## Imperative API

Attach a ref to `<CitationViewer>` and you can control it from anywhere in your tree.

```ts
interface CitationViewerHandle {
  jumpToPage(page: number): void
  setActiveCitation(id: number): void
  clearActiveCitation(): void
  getActiveCitationId(): number | undefined
  getTotalPages(): number
}
```

```tsx
const ref = useRef<CitationViewerHandle>(null)

ref.current?.jumpToPage(5)
ref.current?.setActiveCitation(2)
ref.current?.clearActiveCitation()

const total = ref.current?.getTotalPages()
const active = ref.current?.getActiveCitationId()
```

---

## Sub-components

### PDFRenderer

| Prop                   | Type                     | Default      | Description                                  |
| ---------------------- | ------------------------ | ------------ | -------------------------------------------- |
| `file`                 | `string \| Uint8Array`   | **required** | PDF URL or raw bytes.                        |
| `scale`                | `number`                 | `1.2`        | Zoom level.                                  |
| `citations`            | `Citation[]`             | `[]`         | Citations to overlay.                        |
| `activeCitationId`     | `number`                 | —            | Which citation is currently highlighted.     |
| `highlightColor`       | `string`                 | —            | Inactive highlight color.                    |
| `activeHighlightColor` | `string`                 | —            | Active highlight color.                      |
| `onDocumentLoaded`     | `(n: number) => void`    | —            | Fires with the total page count once loaded. |
| `onVisiblePageChange`  | `(page: number) => void` | —            | Fires when the user scrolls to a new page.   |

### CitationSidebar

| Prop               | Type                   | Default      | Description                      |
| ------------------ | ---------------------- | ------------ | -------------------------------- |
| `citations`        | `Citation[]`           | **required** | The list of citations to show.   |
| `activeCitationId` | `number`               | —            | Which one is currently selected. |
| `onCitationClick`  | `(id: number) => void` | —            | Fires when an item is clicked.   |
| `style`            | `CSSProperties`        | —            | Styles for the sidebar root.     |
| `className`        | `string`               | —            | Class for the sidebar root.      |

### NavigationBar

| Prop            | Type                      | Default      | Description                  |
| --------------- | ------------------------- | ------------ | ---------------------------- |
| `currentPage`   | `number`                  | **required** | The page currently in view.  |
| `totalPages`    | `number`                  | **required** | Total pages in the document. |
| `scale`         | `number`                  | **required** | Current zoom level.          |
| `onPageChange`  | `(page: number) => void`  | **required** | User changed the page.       |
| `onScaleChange` | `(scale: number) => void` | **required** | User changed the zoom.       |
| `style`         | `CSSProperties`           | —            | Styles for the nav root.     |

---

## Highlight model

If your backend already returns bounding box coordinates — from a document intelligence API or similar — you can skip the text search and pass positions directly instead.

```ts
interface Highlight {
  id: number
  page: number
  x: number
  y: number
  width: number
  height: number
  label?: string
}
```

Most people won't need this. If you have the text, just use `Citation.text` and let CitePDF handle the rest.

---

## Troubleshooting

**`citepdf could not be resolved` on `npm run dev`**

You are missing the `pdfjs-dist` peer dependency. It is not auto-installed with citepdf — you must add it yourself:

```bash
npm install pdfjs-dist
```

---

**`Cannot read properties of undefined (reading 'recentlyCreatedOwnerStacks')`**

You have a React version mismatch. CitePDF supports React 18 and 19. Make sure your project is not mixing versions — check that `react` and `react-dom` are the same version in your `node_modules`.

---

**`Cannot set properties of undefined (setting 'workerSrc')`**

Your installed version of `pdfjs-dist` is too old. CitePDF requires v4 or above:

```bash
npm install pdfjs-dist@latest
```

---

**PDF fails to load with a CORS error**

This is not a CitePDF issue — the server hosting the PDF is blocking cross-origin requests. Either serve the PDF from your own domain, use a proxy, or ensure the host server sends `Access-Control-Allow-Origin` headers. PDFs served from your own Vite `public/` folder will always work:

```tsx
<CitationViewer
  file="/my-paper.pdf"
  citations={citations}
/>
```

---

**TypeScript error: property `X` does not exist on `CitationViewerProps`**

Make sure you are on the latest version of citepdf — earlier versions had incomplete type exports:

```bash
npm install citepdf@latest
```

---

## License

MIT © Ozair Hassan
