# Architecture

How the project is organized and the conventions every change follows. CSS rules live in [STYLE_GUIDE.md](STYLE_GUIDE.md).

## Overview

A pnpm monorepo with three packages, deployed to Firebase:

| Package | Stack | Runs on |
| --- | --- | --- |
| `front` | React 19, React Router (data mode), TanStack Query, TanStack Table, react-hook-form, dnd-kit, Vite, CSS Modules, zod | Firebase Hosting |
| `backend` | Express 5, Firebase Admin, zod | Cloud Functions (`api`, europe-west1) |
| `site` | Astro 7, server rendering (node adapter) | Cloud Functions (`site`, europe-west1) |

Firebase Hosting serves everything on one domain: the admin under `/admin`, `/api/**` from the `api` function, and every other path from the `site` function, so the browser talks to one origin (DEPLOYMENT.md, «What Firebase Hosting serves»).

## Frontend: Feature-Sliced Design

`front/src` follows [Feature-Sliced Design](https://feature-sliced.design). Code is split into **layers**; a layer may import only from layers **below** it.

| Layer | Contains | Example |
| --- | --- | --- |
| `app` | Entry point, router, global styles | `app/router.tsx` |
| `pages` | One slice per route; composes widgets and features | `pages/login` |
| `widgets` | Large self-contained UI blocks | `widgets/admin-layout` |
| `features` | One user action each | `features/login`, `features/logout` |
| `entities` | Business entities: data model, requests, read-only UI | `entities/user` |
| `shared` | Code with no business knowledge | `shared/ui/button`, `shared/api/http` |

### Slices and segments

Every layer except `app` and `shared` consists of **slices** named after a business concept in kebab-case. Inside a slice, code is grouped by **segment**:

| Segment | Purpose |
| --- | --- |
| `ui` | Components and their CSS Modules |
| `model` | State, hooks, route loaders and actions, schemas |
| `api` | Requests to the backend or Firebase |
| `lib` | Pure helpers |

```text
features/login/
├── api/        createSession, signInWithFirebase
├── lib/        getLoginErrorMessage
├── model/      login, loginSchema
├── ui/         LoginForm.tsx, LoginForm.module.css
└── index.ts    public API
```

### Import rules

Enforced by dependency-cruiser (`front/.dependency-cruiser.mjs`, run by `pnpm check` and in CI). It checks the resolved paths, so `@/` and relative imports are held to the same rules:

- A slice is imported only through its public `index.ts`: `@/features/login`, never `@/features/login/model/login`.
- A layer imports only from lower layers: `features` may use `entities` and `shared`, never `widgets` or `pages`.
- Nothing imports `app`.
- Inside one slice, use relative imports (`../model/login`). Across slices and layers, use the `@/` alias. This one is a convention, not checked.
- Slices of the same layer do not import each other. Shared needs move down a layer (`isSessionExpiredError` is used by several features, so it lives in `shared/api`).
- Modules never import each other in a circle.

`shared` has no slices. `shared/ui` exposes one public `index.ts` per component (`@/shared/ui/button`). `shared/api`, `shared/config` and `shared/lib` are imported file by file (`@/shared/api/http`) on purpose: a common index would make every chunk that needs the HTTP client also load Firebase.

### Naming

- Folders of slices and of `shared/ui` components: kebab-case (`admin-layout`, `password-input`).
- Component files: PascalCase, one component per file, CSS Module beside it (`LoginForm.tsx`, `LoginForm.module.css`).
- Other files: camelCase, named after what they contain (`getCurrentUser.ts`, `toast.ts`, `loginRoute.ts`).
- Page components end with `Page` (`GalleryPage`).

### Routing and data

- Paths and admin navigation titles are defined once in `shared/config/routes.ts`.
- `app/router.tsx` maps paths to lazily loaded pages.
- Data is loaded through React Router loaders, not effects. An action is used only for a change that leads to another page:
  - the admin layout route uses `requireSession` (`entities/user`) once, on entering the admin (`shouldRevalidate: () => false`); on 401 it redirects to `/admin/login?redirectTo=…`, and that redirect wins over a failed page loader. Any other failure is an error, not a reason to sign in again. Most page loads are public GETs, so a session that expires later is found by the next change: its toast says the session expired (`sessionExpiredMessage`);
  - inside the admin area, `useSessionUser()` returns the signed-in user;
  - the login page has its own loader and action in `pages/login/model/loginRoute.ts`;
  - logout is a `<Form method="post">` to the `/admin/logout` action (`features/logout`). When the session may still be there (no connection, a refused request), the action shows an error toast and returns to the page the form was sent from. After a server error it asks `/auth/me` first: the server may have cleared the cookie and failed only to revoke the session, or a proxy may have answered before the server was reached;
  - server data lives in the TanStack Query cache (`queryClient` in `shared/api/queryClient.ts`). An entity exposes each request as query options (`contactLinksQuery` in `entities/contacts`). Nothing refetches in the background except the translations, which the translator changes itself: the admin is the only one who changes the rest;
  - an edit section loads its resource afresh on entering it: its loader calls `loadFresh` (`shared/api/pageData`) right in the `routes.ts` of the page. The navigation waits for the data up to a second, so a fast load shows no skeleton; a slower one opens the page with its skeleton. The section waits in `AwaitPageData`, reads the data with `useSuspenseQuery` and passes it to the form. Requests are not cancelled: one that has started runs to its end, even when the page was left;
  - a table only shows its data, so its loader calls `loadCached`: coming back to it shows the cache at once, without a skeleton, and the fresh data replaces it when it arrives. Data a change has invalidated is not shown: the page waits for it, as a form does;
  - the form stays on the page, so it saves in its react-hook-form submit handler (`EditContactLinksForm`) through a mutation hook (`useSaveContactLinks`). The mutation sends the changes and puts what the server saved into the cache (`setQueryData`); then the form resets to the saved values and shows the result. `isSubmitting` disables the form meanwhile;
  - logout clears the query cache.
- Every change carries the CSRF token without its caller knowing: `http` (`shared/api/http.ts`) asks `GET /api/auth/csrf` for it with the first change and reuses it. A 403 means the session changed, for example after signing in again in another tab: `http` asks for the new token and sends the change once more. Login goes without a token (`withCsrfToken: false`); logout forgets it.
- `PageLoading` is the `HydrateFallback` shown while the first loaders run.
- A pathless root route catches every error that no route below handles with `ErrorPage` (`pages/error`), imported eagerly so it works when a chunk fails to load.
- Admin pages are nested in a pathless route whose `ErrorBoundary` is `AdminPageError` (`widgets/admin-layout`): a page that fails to load or render is replaced inside the layout, and the navigation stays usable.

### Forms and feedback

- Forms use react-hook-form with a zod schema that mirrors the server rules. Text controls (`Input`, `Textarea`) are built on `Field` (`shared/ui`), which owns the label, the `hint`, the error and the frame; modified fields are highlighted with `isModified`.
- A form edits one resource of the API and saves all of its changes or none of them. A page with several resources gives each its own section: a child route with its own URL, loader and form (`pages/about`: `/admin/about/text`, `/photo`, `/process`). The page is the layout route, and `TabNav` (`shared/ui`) links the sections, drawn as tabs. Switching sections is a navigation, so unsaved changes are always in the open section, and leaving it asks first, as leaving any page does.
- Files are picked with `MediaPicker` (`shared/ui`), one file at a time. It checks the type and size against the rules it gets (`rules={imageUploadRules}`) and shows thumbnails that open in `PreviewDialog`, but it uploads nothing: in a form the picked `File` is kept and sent on save, so revert and the unsaved-changes guard cover it too; a field saved on its own uploads it at once and shows `isBusy` meanwhile. The upload rules (`imageUploadRules`) and the image the API returns (`imageSchema`) live in `shared/api/image`. One stored image in a form, such as the photo with alt text, uses `ImagePicker` (`shared/ui`): its value is `ImageFieldValue` (`shared/lib/imageFieldValue`), the saved image (`savedImage`), a picked `File` or `null`.
- A single photo with alt text («Моё фото») mirrors `PhotoSlot` of the backend: `photoSchema` in `shared/api/photo`, the form fields in `shared/lib/photoForm` (`photoFieldsShape` with `refinePhoto` in the schema, `toPhotoFormValues`, `toPhotoBody`), and `PhotoFields` (`shared/ui`), which reads `photo` and `photoAlt` from the form context. `photoSlot(path, queryKey)` (`shared/api/photoSlot`) is the resource with its query, and `saveSlotPhoto` sends a change of it; an entity only names its slot (`aboutPhoto` in `entities/about`). `EditPhotoForm` (`features/edit-photo`) is the whole form with its saving; a page gives it the slot, the photo and the label.
- An ordered list of files with fields per file uses `SortableMediaList` (`shared/ui`), the About process photos for example. Rows are moved by dragging their handle (dnd-kit) or with the arrow buttons, so the order can be changed without dragging (WCAG 2.5.7); a single row cannot be moved. Each row can be replaced or removed and shows the fields its owner renders. The form keeps the rows in `useFieldArray`, with the field `id` as the row key, and resets them to the list the server returns after a save. `MediaPicker` and `SortableMediaList` are built from the same parts: `MediaFieldset` and `FileInput` (`shared/ui/media-field`), `MediaThumbnailButton`, `MediaFileName` and `MediaPreviewDialog` (`shared/ui/media-preview`), and the file checks (`getFileRejection`, `useFileDrop` in `shared/lib`).
- Every sortable list is built from `shared/ui/sortable`: `SortableList` (the sensors, the vertical axis and the screen reader announcements), `useSortableRow`, `DragHandle` and `MoveButtons` for each row, `useSortableRowFocus`, which puts the focus back on a moved or removed row, and `SortableMessages` with the texts of its own noun («Фото … взято», «Проект … взят»). The projects order form (`features/edit-projects`) is built from them too.
- A table that is searched or sorted uses TanStack Table (headless; the markup is a plain `<table>` with `aria-sort` on sortable columns), the projects table for example. What every table does (sorting by one column, pages) and the `meta` of its columns are declared once, in `dataTableFeatures` (`shared/ui/data-table`); a feature types its columns as `DataTableColumn<TItem>`; its search field is `SearchInput` (`shared/ui`). Its search, sorting and page live in the address (`?q=…&sort=title.asc&page=2`), so going back to it brings the same view. The search field keeps what is typed and writes it into the address after a pause (`useTableSearch`): a change of the address is asynchronous, and a field bound to it would lose its caret and letters. A long table shows 50 rows at a time; a change of the search parameters alone loads nothing again (`revalidateUnlessOnlySearch` in `shared/lib`). A sorted table never reorders items: an order that the site shows is edited in a form of its own.
- A list of photos with alt text, such as the process photos, the photos of a project or of the contacts slideshow, is a `PhotoListField` (`shared/ui`) on the `photos` field of its form. `shared/lib/photoListForm.ts` holds its rows (a saved photo, or a new file), their schema, and `toPhotoListItems`, which uploads the picked files and builds the list the API replaces. `disabled` keeps the list as it is while the form shows something else in its place, as the box «Показывать фото из галереи» of the contacts slideshow does.
- Things that do not belong together are saved on their own, without a form: each page hero (`PageHeroCard` in `features/edit-page-heroes`) is uploaded as soon as a file is picked; a hero can be replaced, not removed, since the site does not show a page without one. Each card reads its own hero (`pageHeroQuery`); an upload puts the hero the server answered with into the cache (`setQueryData`), and a failure loads it again.
- A photo reaches the API in two steps: the file goes to `POST /api/uploads` (`uploadImage` in `shared/api/upload`), and the change refers to it by its `uploadId` in a JSON body. A failed upload rejects with `UploadError`, which names the file; `requestErrorOf` gives the request error behind it for the messages by status.
- Components of `shared/ui` read no data and save nothing: they get everything through props or the form context. A form or a table of a feature only puts parts together: the columns of a table are a file of their own (`worksColumns`), its cells are components, and the editing of a row and a confirmation are hooks.
- A deletion that cannot be undone asks first in `ConfirmDeleteDialog` through `useConfirmation` (`shared/lib`): a row of a table always, a saved photo of a list always (`SortableMediaList`, `isSaved`), an item of a list while works name it. What a form only takes out until it is saved, such as a work of a collection, needs no question: «Отменить» brings it back.
- Every change is conditional (RFC 9110 §13.1.1). A resource comes with its `ETag` (`http.getWithETag`, as `Tagged<T>`), and a change sends it back in `If-Match` (`http.putIfMatch`); the server refuses a resource changed since, for example in another tab, with 412. A form keeps the resource it was made from with its tag, and resets only to what a save returns with its new tag; `useSavedForm` (`shared/ui/edit-form`) owns this for every form. After a 412 the changes stay in the form, and a toast asks to reload the page (`conflictMessage` in `getSaveErrorMessage`, unless the change has a text of its own for 412): the site has one admin, so a conflict comes only from another tab of theirs. A deletion from a table (`http.deleteResource`) sends `If-Match: *`: the rows have no tags, and a row names the resource by its title. A deleted resource answers 204 with no tag. A photo slot and a page hero have no deletion: their image can be replaced, not removed. A new element of a collection, such as a project, is created with `http.putIfNoneMatch` under an id its form picks once: when a try created it but its response was lost, the next try gets 412 and creates no second one. It never overwrites the saved element, which may have changed since in another tab: the form shows a toast and opens what is saved. A list is saved as a whole: the process photos form uploads the picked files one by one (`uploadImage` reuses the upload of a file for an hour, so a repeated save does not send it again), then sends the full list in one `PUT`, which the server saves all or nothing.
- A translated form is wrapped in `LanguageForm` (`features/edit-translations`), which switches the page between Russian and the form of each language. Editing translations is a feature of its own and features do not import each other, so a page hands the form its `languageForm` (`LanguageFormSlot` from `entities/translation`). Every language saves on its own, and only the texts that changed. The names of the translations on the server are in `translationResources`. The texts come from `translationsQuery`, which is never taken as fresh, so a form reads them anew when it opens, and which is read again every two seconds while the translator works; a save of the resource itself asks for a new read, as its texts may have gone to the translator; a save cancels the reads under way, as they would bring the old texts back.
- An edit form is an `EditForm` (`shared/ui`): the fields, then `FormActions` with the save button and, while there are unsaved changes, the revert button. It reports its unsaved changes with `useReportUnsavedChanges` to `UnsavedChangesProvider` (`shared/ui/unsaved-changes`), which the admin layout renders once around the pages: React Router allows one blocker at a time. While any form of the page has unsaved changes, leaving it asks first (`useUnsavedChangesGuard` in `shared/lib`, `ConfirmDialog`). A navigation a save makes itself, such as opening a project once it is created, first calls `useAllowNextNavigation` with the path: the guard learns that the changes are saved only on a later render.
- A change shows its result through the query client: its `useMutation` declares `meta.feedback` (`MutationFeedback` in `shared/api/queryClient`: `getErrorMessage`, `toastId`, optionally `successMessage`, «Изменения сохранены» by default), and the app shows the error or the success toast (`shared/ui/toast`): `showMutationFeedback` (`app/mutationFeedback.ts`) subscribes to the mutation cache once, so the data layer knows nothing about the UI. A form only resets its fields after a save and keeps them after a failure; a save with nothing to send shows the success toast itself with the same `toastId`. Errors stay until closed. Toasts of one action share an `id`, so a new result replaces the previous one.
- Where feedback goes: a client check (an empty required field, the type or size of a file) is shown under its field; a failed request (the server, the connection, an expired session) and a successful change are shown in a toast; a page that fails to load is replaced by its error screen; a failed sign-in is shown in the login form. An error toast names what was not saved, such as the page whose hero failed.
- Request error texts live in `shared/api/requestErrorMessages`. A change, such as a save or a deletion, gets its text from `getSaveErrorMessage`: an expired session (`isSessionExpiredError`) shows `sessionExpiredMessage`, then the change's own texts by status apply (`byStatus`, as `getSaveContactLinksErrorMessage` gives them), then no connection and server errors, then its `fallback`. The photo with alt text has `getSavePhotoErrorMessage` (`features/edit-photo`). A failed load and other requests use `getRequestErrorMessage`, which covers only no connection and server errors. The errors of several parts are joined with `joinMessages` (`shared/lib`).
- An icon-only button is an `IconButton` with a `label`, wrapped in a `Tooltip` with the same text.

### React conventions

- Built-in hooks and APIs are called through the namespace: `React.useState`, `React.useEffect`, `React.useId`. Named imports from `react` are for types only.
- Props are described by an `interface ComponentNameProps`. `ref` is a regular prop (React 19).
- Static visual values belong in CSS; React passes only runtime data, such as `--active-index`.
- Accessible names and semantics are part of a component's contract: buttons have labels, decorative elements are hidden from assistive technology.
- Supported browsers are [Baseline Widely available](https://web.dev/baseline), the default build target of Vite. A newer API is used only behind a check, as the View Transition of the theme is (`'startViewTransition' in document`); no polyfills.

## Public site: Astro

`site` is the public site, built with [Astro](https://astro.build) and rendered on the server, so every page reaches search engines and link cards with its full HTML. Its folders follow the conventions of the Astro docs; only `src/pages` is required by Astro itself.

```text
site/src/
├── pages/            routes; thin, they only put blocks together
├── layouts/          the frame of a page: <html>, <head>, header and footer
├── components/
│   ├── ui/           primitives of the design system
│   ├── controls/     switches a visitor uses
│   └── blocks/       the parts a page is built from
├── styles/           design tokens, breakpoints, themes
├── actions/          what a visitor sends, such as the newsletter form, run on the server
└── lib/              code with no markup: requests, languages, formatting
```

A folder imports only from the folders below it: `pages → layouts → blocks → controls → ui → lib`; `styles` may be used by any markup. `actions` import only `lib`: the browser of a visitor never calls the API, so a form posts to its action (Astro Actions), which works without JavaScript too and checks its input with zod before it calls the API. dependency-cruiser cannot read `.astro` files, so Biome enforces this with `noRestrictedImports` (the `site/src/...` overrides in `biome.json`), for relative and `@/` imports alike.

### Languages

- The site has the 26 languages of the backend (`lib/i18n/languages.ts`; a test keeps the lists equal), and every page lives under the code of its language: `/en/`, `/pl/contact`. `<html>` names the variant the texts are in (`pt-BR`, `zh-Hans`) and sets `dir="rtl"` for Arabic.
- Pages are rendered on request (`output: "server"`, the node adapter in standalone mode, wrapped by the `site` function in `site/firebase.js`), so a change in the admin reaches the CDN without a build. The CDN keeps a page for a minute (`s-maxage=60`, `site/src/middleware.ts`); after that, for up to a day (`stale-while-revalidate`), the first visitor still gets the old copy while the CDN fetches the new one, and the visitors after them get the change. On a quiet site the old copy can thus be seen well after the minute.
- The root `/` redirects to the best language of the browser (`Accept-Language`, by weight, with `de-AT` finding `de`), else to English. The redirect differs from visitor to visitor, so it is never cached. A language chosen with the switch is not remembered for the next visit: Firebase Hosting passes a function no cookie but `__session`, which holds the admin's session (docs/TODO.md, «Запоминание выбранного языка»).
- The texts of the interface live in `lib/i18n/messages/<language>.json`; `en.json` is the source, and `t(language, key)` is typed by its keys. A text not translated yet shows in English. Content written in the admin is translated by the backend instead.
- A new text: add its key to `en.json`, run `pnpm --filter site i18n:translate`, and read the diff. The script sends DeepL only new texts and texts whose English changed, so a translation edited by hand stays; `translatedFrom.json` keeps the English of each translation. A test keeps every language on the keys of English.
- Read the diff before committing: DeepL is told the site is one person's (`context` in the script), yet it still turns «Get in touch» into «Contact us» in some languages, and it gives «the artist» a gender. Alone, «About» of the menu becomes a bare preposition («Über», «O») or «About us»: on this site it is «About me». «Take me home» becomes a way to one's house («Portami a casa», «带我回家»): it is the home page. A polite request comes out as «we ask» («Kérjük», «Prašome», «Vă rugăm»), and «Thank you» or «I will write» take the speaker's gender in Portuguese and Hindi: say it without them. Fix such a text by hand in the language file, and keep the English free of words that need a gender.
- A heading spans its column on one line in every language: translate it with one or two words (Kontakt, Contacto), the way sites of that language name the section. A longer one goes on two lines and breaks the proportions of its block. Check the page in every language after such a change.

### Search engines and link cards

- `BaseLayout` takes the `path` of a page, its `title` (but for the home page) and its `description`, which comes from the texts of the page cut to about 160 characters: the artist writes no separate one. Without a description the tag is left out, and a search engine quotes the page. Through `PageMeta` it writes, through `PageMeta`, the title, description, canonical address, the page in every language (`hreflang`, with English as `x-default`) and the Open Graph tags of a link card.
- `robots.txt` and `sitemap.xml` are endpoints in `pages/`. The sitemap lists the paths of `lib/site/pagePaths.ts` in every language: a new page adds its path there. Crawlers are kept out of `/api/` only; the admin stays open to them, so they read its `noindex`.
- Absolute URLs come from `SITE_URL` (Astro's env schema in `astro.config.ts`), which Astro bakes in while building, so the build fails without it. Locally it is in `site/.env` (see `site/.env.example`).

### Data

- A page reads its data on the server with `getJson(path, schema, { language })` (`lib/api/`): the resource of the API in the language of the page (`?lang=`), checked against a zod schema the page owns, as the entities of the admin do. The browser of a visitor never calls the API. The API is at `API_URL`, which Astro checks like `SITE_URL`.
- The API answers in 5 seconds or the page gives up. A resource the API does not have (`isNotFound`) makes the page a 404: `return Astro.rewrite("/404")`. A resource that always exists, such as the contacts, has no such case: its 404 means a broken API, and the page is a 500. Any other failure, an answer of another shape included, is thrown and becomes the 500 page. Both error pages speak the language of the path and carry `noindex`.
- Public reads of the backend learn `?lang=` resource by resource, with the page that first needs them; the contacts, the About page and the projects (the list and its intro) have it.
- An image of the API is shown by `Picture` (`components/ui`): AVIF, else WebP, from the files of every width (`srcset`), with the `sizes` the page knows. Until it loads, the preview the API gives with it (`placeholder`, 16px wide) holds its place, stretched and blurred, and the image fades in over it as it arrives (the script of `BaseLayout` marks every image as it loads). Only the largest image of the first screen gets `priority`, so it loads before the others. A `deferred` image keeps its files in data attributes until a script loads it (`loadDeferredImages` in `lib/images`): an image in view, such as a slide under another, would load at once even when lazy.
- Every slider of the site is built on [Embla Carousel](https://www.embla-carousel.com) with its plugins, not written by hand. `Slideshow` (`components/ui`) is photos that fade slowly into one another by themselves (Fade, Autoplay), each coming 4% closer while shown (Ken Burns, CSS; still for `prefers-reduced-motion`): 5 s a photo, it waits while the pointer is over it, can be swiped, and does not play for `prefers-reduced-motion`. A slide not in view is `inert`; the shown one and the next are loaded, the rest wait (`deferred`). Its box gives the shape, through `class`.
- `PhotoCarousel` (`components/ui`; the About page through `ProcessGallery`, and each project) is an endless Embla row (`loop`) with «Prev» and «Next» under it: equal 16:9 slots within the column, as in the mockups, two on a laptop and one below, each photo cropped to its slot (`data-cropped` for PhotoSwipe) and opened whole. Photos that fit the page do not move and have no buttons. The two first load with the page, the rest as they near the view. A photo opens on the whole screen in [PhotoSwipe](https://photoswipe.com) (`lib/site/photoViewer.ts`, loaded at the first opening), in the colors of the site; the row follows the photo it closes on.
- The list of projects (`ProjectList`, `ProjectItem`) is rows of `<details name="projects">`: one project open at a time, opened without a script, and the search of the page opens the one it finds. It slides open with `::details-content` (a grid row 0fr → 1fr). The carousel starts once it has a width (`ResizeObserver`), so a closed project loads no photos. The address names the open project (`#slug` of its title, else its id; `replaceState`), and a link with it opens it. A project opened below an open one keeps its row in place: the upper one shuts at once and the page scrolls by as much in `requestAnimationFrame`. Opening, its content unfolds in turn (CSS animations: the photos rise and settle, then the description, then the link). Under a mouse, the other rows dim to 0.45 (`:has()`), and the first photo of a closed project follows the pointer beside its row (`lib/site/followPointer.ts` writes the pointer into custom properties once a frame; CSS places and eases it); its photos load when the pointer first enters the list, and a touch screen neither shows nor loads them.
- `Reveal` (`components/ui`) makes a block rise and fade in the first time it comes into the screen, once, by an IntersectionObserver: CSS can play an animation once on entering the view only in Chrome (`animation-trigger`), and a scroll-driven one runs back and forth and is missing in Firefox. A block in the screen at load stays as it is; nothing moves for `prefers-reduced-motion`.
- The scroll between the hero of a page and the page itself slides by [GSAP](https://gsap.com) (ScrollTrigger and ScrollToPlugin, `lib/site/snapHeroScroll.ts`), and only that: as soon as the scroll passes the wiped line, the page slides in; back up, the hero slides back, with its line written at the bottom (`heroReturnScroll`), once the visitor pulls past 15% of the screen or flicks up fast, and a smaller pull slides back to the page as the scroll rests. While a slide runs, the wheel and the finger wait. Within the hero and the page the scroll is free. CSS `scroll-snap-type` was tried and left out, as browsers disagree on it for a scene taller than the screen. GSAP is loaded at the first scroll and never with `prefers-reduced-motion`. The rest of the motion of the site stays in CSS (scroll-driven animations, View Transitions).

### Header, menu and footer

- `BaseLayout` asks the API, together and once a page, for what the header, its menu and the footer show: the links of the artist, the currencies with a rate and the heroes of the pages (`lib/api/contactLinks`, `availableCurrencies`, `pageHeroes`). A failed read only leaves its part out. Its `frame` says what stands around the page: `page` (the default) the hero, the header and the footer; `menu` the hero, then the menu of the site as the whole page (`MenuPanel`, the block the menu of the header wraps in its dialog), without a header or a footer: the home page, which leads to the others; `none` the page alone, without reads: the error pages.
- The pages of the menu and their order are `lib/site/menu.ts`, shared by the header, its menu and the footer; `page` names the page of the admin («Страницы») whose hero an entry shows under the pointer.
- `SiteHeader` holds the name (`HomeLink`: Latin capitals in every language, `translate="no"`) and the button of the menu; from 48rem also the link to the gallery and the switches, which on a smaller screen are in the menu. With its script it sticks to the top and goes out of sight while the visitor scrolls down, back on any scroll up, and stays while it has the focus or an open list; without the script it scrolls with the page.
- `SiteMenu` is a modal `<dialog>` the browser runs: the buttons of the header and of the hero open it (`commandfor`), and it asks to close from its own (`request-close`), by Escape or by a click beside it (`closedby="any"`); the browser makes the page under it inert, moves the focus to its list of pages and back to the button that opened it. It unrolls from `@starting-style` and rolls back up the same way in every browser: every way of closing it comes as a `cancel` event, which `rollUpOnClose` stops, marks it `data-closing` while still open, waits for the transitions of the style and only then closes it. `standInDialogControls` stands in for the controls a browser lacks (`commandfor` and `request-close`, `requestClose()`, `closedby`), and `returnFocusQuietly` keeps Safari from drawing the ring of the keyboard after a click. From 48rem it leaves the switches to the header, as in the mockup: opened from the hero, it has none. It unrolls by `clip-path`, so its name and button lie exactly over those of the header, and the two lines of `MenuIcon` turn into its cross (`--menu-icon-cross`, a registered custom property). Under a pointer a page fills its plate with its hero; without one the photos are never loaded.
- A list that opens from a button (`Dropdown`, `components/ui`) is a popover too, placed under it by CSS anchor positioning and flipped to the side with room; a browser without anchor positioning shows it in the middle of the screen.
- The switches (`components/controls`): the languages are links to the same page in each language, named in their own language and ordered by `Intl.Collator("und")`, by script, then alphabetically. The theme and the currency need a script, so they are not shown without one. The theme is kept in `localStorage.theme` and read before the first paint by the inline script of `BaseLayout`; the currency in `localStorage.currency`, never in the address, and a change sends `currencychange` on `document` for the prices to follow.
- Motion comes from the motion tokens and stops for `prefers-reduced-motion`. `scrollbar-gutter: stable` keeps the page still while the open menu stops it from scrolling.

### Pages

- The hero (`PageHero`) holds the `<h1>` of every page, the name of the page hidden from the eye (`VisuallyHidden`): the line drawn across the work is `aria-hidden`. A heading of the page itself is an `<h2>`.
- Icons are line drawings from [Lucide](https://lucide.dev) (ISC license), one file each in `components/ui/icons`, on the frame of `Icon.astro`, which hides them from screen readers: the text beside them names the link.

## Backend

The backend is split by **domain modules**, as recommended by [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices#1-project-architecture-practices): everything about one domain lives in one folder. Code that knows nothing about the domain lives in `shared/`.

```text
backend/src/
├── firebase.ts         Cloud Function entry point
├── server.ts           Express app: global middleware and top-level module routers
├── modules/            one folder per domain
│   ├── about/          the whole About page for the site; document.ts is the Firestore document shared below
│   │   ├── text/       the texts: schema.ts and resource.ts
│   │   ├── photo.ts    «My photo», a photo slot mounted by the about router
│   │   └── process-photos/  the ordered process photos, mounted by the about router
│   ├── auth/           the session and its cookie, CSRF tokens, protectChanges, requireAuth
│   ├── contacts/       the whole contacts page for the site; document.ts is the Firestore document shared below
│   │   ├── links/      the contact links: schema.ts and resource.ts
│   │   └── slideshow/  the photos of the slideshow, or the gallery in their place, mounted by the contacts router
│   ├── currencies/     the rates of the currencies against the US dollar, set by hand
│   ├── gallery/        routes.ts mounts everything below under /api/gallery
│   │   ├── collections/ the collections, each a Firestore document with its cover and years
│   │   ├── colors/     the colors, one list sorted by title
│   │   ├── intro/      the text above the works
│   │   ├── materials/  the materials, one list sorted by title
│   │   ├── palettes/   the palettes (pastel, bright…), one list sorted by title
│   │   ├── sections/   the sections, each a Firestore document with its subsections
│   │   └── works/      the works, each a Firestore document; representation.ts is what the API returns (sizes in cm and inches), prices.ts the prices computed from the rates, references.ts what a work refers to, order.ts and visibility.ts how the works are listed
│   ├── health/
│   ├── newsletter/     POST /api/newsletter/subscribers: a visitor subscribes; the same answer for a new and a known address
│   ├── originals/      GET /api/originals, the uploaded files, for the admin alone
│   ├── pages/          the pages of the public site and their main photos (heroes)
│   ├── projects/       the projects, each a Firestore document of its own, and their order
│   │   └── intro/      the text above the projects
│   └── uploads/        POST /api/uploads, the only multipart route
└── shared/             no knowledge of the domain
    ├── config/         env, cors
    ├── firebase/       Firebase Admin clients: app, auth, firestore, storage; documentResource
    ├── http/           HttpError, entity tags, Problem Details, the shared routers (document resource, photo slot), Express request typing
    ├── images/         image processing with sharp, uploads, stored images, saving with files, photo slots, photo lists
    ├── middleware/     content-type, preconditions (If-Match), validation, upload, error
    └── text/           titles: compared whatever the case, sorted in the Russian alphabet
```

- A module has one file per role: `routes.ts`, `controller.ts`, `service.ts`, `schema.ts`. The request flow is route → middleware → controller → service.
- Data the site reads as a whole and the admin replaces as a whole, kept in one document, is a `documentResource` (`shared/firebase/document-resource.ts`): the intros, the colors, materials and palettes, the rates, the About texts, the contact links. Such a module has only `schema.ts` and `resource.ts`, which says where the data lives; its routes are `documentResourceRouter(resource, bodySchema)` (`shared/http/document-resource-router.ts`). A change replaces only the fields of the resource (`mergeFields`), so what else the document holds stays.
- `shared/` never imports `modules/`; Biome enforces it. A module may use another module, as `originals` uses `requireAuth` from `auth`, but never its `service.ts`: what others need, such as where the documents are and how they are read (`document.ts`), lives in a file of its own.
- `server.ts` mounts only top-level modules. A submodule is mounted by its parent's router, as `contacts` mounts `links`. A photo slot is mounted as `photoSlotRouter(aboutPhoto)` (`shared/http/photo-slot-router.ts`). `modules/` holds only resources of the API; a router any module mounts is in `shared/http`.
- Each part of a page that the admin saves on its own is a resource of its own, with its own `GET` and `PUT`: `/api/about/text`, `/api/about/photo`, `/api/about/process-photos`. A `PUT` replaces the whole resource at its URL (RFC 9110 §9.3.4), never a part of a larger one. The page itself (`GET /api/about`) is a read-only aggregate, so the site reads it in one request.
- A single image is an `ImageSlot` from `shared/images/slot.ts`: a Firestore document, a field, the schema of what the field stores, and a Storage folder. Filling and replacing a slot are shared. A page hero stores the image alone; a photo with alt text («My photo») is a `PhotoSlot` from `shared/images/photo.ts`, which adds the alt text and its update. The module only names its slot (`modules/about/photo.ts`).
- Data read from Firestore is checked for its shape only (`stored…Schema`): limits and formats are checked once, when the API writes the data. Tightening a rule later then never makes saved data unreadable. Zod runs only on what comes in, request bodies and stored data. What the API returns is described by plain TypeScript types in `schema.ts`.
- A photo is uploaded once (`shared/images/uploads.ts`): it is encoded and kept privately under `uploads/{id}` with a manifest, which is written last. A change that uses it copies it into a new version folder of its content (`publishUpload`) before Firestore is written, and replaced files are deleted last, so the site never links to missing files. That order lives in one place, `saveWithImages` (`shared/images/saving.ts`): a service copies files and writes inside it, and if the save fails, the copies are removed. Uploads, used or not, are deleted by the bucket's lifecycle rule (`storage.lifecycle.json`) a day after they were made: a used one stays, so a change repeated after its response was lost can still refer to it. Every change that reads and writes a document runs in a transaction.
- Every change of the content is conditional. A resource's `GET` returns the `ETag` of what it returns (`entityTag` in `shared/http/etag.ts`), so a change of the response, such as a deleted material a work refers to or the date of a save, changes the tag, and a strong 304 is never stale; the change checks `If-Match` against the same representation (RFC 9110 §8.8.3; an empty photo slot is `null`); `PUT` and `DELETE` need it in `If-Match` (`requireIfMatch`): 428 without it, 412 once the resource has changed (`assertIfMatch`, in the transaction that writes). The response to a change carries the new `ETag`. A collection edited as a whole, such as the process photos, is replaced by one `PUT` of the full list: an item names a saved element by `id`, a new file by `uploadId`, or both to replace a file; a saved element left out is deleted. The photos of such a list, of the process photos, of a project or of the contacts slideshow, are saved by `preparePhotoList` (`shared/images/photo-list.ts`). A photo in the body of a change is `{ alt, uploadId? }` (`photoBodySchema`): without `uploadId` the file stays and only the alt text changes. A single resource is returned as itself, without a wrapper; a list as an object with a named array (`{ works: […] }`).
- Translations live apart from their resource, in `translations/{resource}`, so the translator never changes the `ETag` of an open form. A save records the Russian texts in its own transaction (`saveSources`), then `requestTranslations` puts the resource in the queue, and the `translate` function (`modules/translations/worker.ts`) makes what is missing. `shared/i18n` holds only what the saves of other modules need; the admin's commands, the worker and DeepL are in `modules/translations`. The status of a text comes from the source stored with it, so a task needs no state of its own: a person's edit is never replaced by itself, and a text asked anew stays until the new one is made.
- A public `GET` the site reads takes the language of its page as `?lang=` (`languageQuerySchema` in `shared/i18n/language-query.ts`, checked by `validateQuery`; an unknown language is 400 naming the `parameter`); without it the texts come in Russian. A service reads the translations of its resource beside the resource (`readTranslations`) and picks each text with `translatedText` (`shared/i18n/translated-text.ts`): the translation, even one made from an older source, else the English one, else the Russian text.
- `PATCH /api/translations/:resource/:language` is the one change without `If-Match`: the translator changes the resource at any moment, so its tag would refuse every save. It names only the texts it changes, and each edit names the source it was written from, so an edit of an older source shows as out of date. Two tabs that edit the same text overwrite each other: the last one wins.
- A collection whose elements are edited one at a time, such as the projects, keeps each element in its own Firestore document at `/:id`. The client picks the id of a new element (a UUID) and creates it with `PUT` and `If-None-Match: *` (201); the server answers 412 once the id is taken, so a create repeated after a lost response never makes a second element. `PUT` with `If-Match` and `DELETE` change it. Its order is a resource of its own (`/api/projects/order`, the ids in order) stored as a `position` in each document; the `ETag` of an element leaves the position out, so reordering does not outdate an open edit form. The server dates each element: `createdAt` once, `updatedAt` on every save of the element, not on a move.
- A work keeps its collection itself (`collectionId`). A `PUT` of a collection lets go of its own works and takes free ones, and refuses a work of another collection with 422: the `If-Match` of this collection says nothing about that one. A work moves to another collection only in its own form.
- A hidden work (`published: false`) is the admin's alone. The public `GET`s of works and collections pass `identifyReader` (`modules/auth/middleware.ts`): without a session the reader is a visitor, who gets only published works (a hidden one is 404, and the `workIds` of a collection leave it out); with a valid session the reader is the admin, who gets them all in an answer marked `Cache-Control: private, no-cache`; an ended session is 401. The answer depends on the cookie, so it carries `Vary: Cookie`.
- Every change goes through `protectChanges` (`modules/auth/middleware.ts`), which `server.ts` mounts in front of the routes: a method other than `GET`, `HEAD` and `OPTIONS` needs the admin's session and its CSRF token, so a new route is protected without asking for it. Only `/api/health`, `/api/auth` and `/api/newsletter` are mounted before it; a route of the admin added to them protects itself.
- The session is the `__session` cookie: Firebase Hosting passes the function no other cookie. The CSRF token is an HMAC of that cookie, issued by `GET /api/auth/csrf` and sent back in `X-CSRF-Token`, so every tab of a session has the same token and a new session gets a new one. Login needs no token: there is no session yet, and only the admin can sign in.
- Global Express typing lives with its owner: `modules/auth/express.d.ts` declares `Locals.auth`, `shared/http/express.d.ts` declares `Request.file` and `rawBody`.
- Code imports through subpath imports (`#modules/auth/service`, `#shared/http/errors`). There are no barrel files.
- Express 5 forwards rejected promises to the error middleware, so handlers do not wrap code in `try/catch` only to call `next(error)`.
- Environment variables are read through `getEnv()` in `shared/config/env.ts`, validated once on first use. `CSRF_SECRET` is a Secret Manager value that reaches the function as a variable.
- Errors meant for the client are thrown as `HttpError` subclasses; the error middleware sends every error as RFC 9457 Problem Details. Anything else is logged and returned as a generic 500.
- The API is described by its code: each module's `routes.ts` lists its endpoints, and `schema.ts` holds the Zod schemas that validate requests and the types of the responses. Controllers are typed with them (`RequestHandler<Params, Response, Body>`), so a handler cannot send another shape.

## Tests

- `pnpm test` needs no outside service. `tests/document-resources.test.ts` checks every document resource from one table, through the real `server`. `tests/integration` runs against the real Auth, Firestore and Storage emulators: the way of the admin through the API, transactions, file copies, two saves at once. Run it with `pnpm test:emulators` (needs Java 21 and free emulator ports). `tests/front-rules.test.ts` checks the rules the front repeats against the API. CI runs it too.
- Backend tests live in `backend/tests`, mirroring `src` (`tests/modules/contacts/links/service.test.ts` tests `src/modules/contacts/links/service.ts`), and run with Vitest. Their environment is set in `backend/vitest.config.ts`.
- `backend/tests/support` holds shared helpers: `startTestServer` runs an Express app on a free port, `adminHeaders` returns the session cookie and CSRF header of a signed-in admin, `apiImage` returns a complete image for mocked services, `routeApp` builds the app for a route test: the global middleware, the auth routes and the router under test. Import them with a relative path ending in `.js`.
- Frontend tests live in `front/tests`, mirroring `src` in the same way, and run with Vitest in happy-dom (`front/vitest.config.ts`). They cover the logic: form schemas, the changes a save sends, the save functions, error messages, route loaders and actions, and hooks. Components are not tested yet.
- Frontend tests talk to the API through MSW: `tests/support/server.ts` intercepts every request, and a request without a handler fails the test. Each test sets its handlers with `server.use`; `recordRequests` lists the requests sent, in order. Other helpers in `front/tests/support`: `csrfHandler`, `uploadsHandler`, `problem` and `noContent` (`handlers.ts`), `apiImage`, `apiPhoto`, `apiListPhoto` and `imageFile` (`images.ts`), `fieldErrors` for schemas, `routeArgs`, `formActionArgs` and `thrownResponse` for loaders and actions.
- Frontend tests import the module under test by its own path (`@/features/edit-about/model/saveProcessPhotos`), not through the slice's `index.ts`. `vi.mock` is kept for what MSW cannot replace: Firebase and the toasts.

## Adding an admin page

1. Add the path to `routes` and the title to `adminNavigation` in `shared/config/routes.ts`.
2. Create `pages/<name>/ui/<Name>Page.tsx` and `pages/<name>/index.ts`.
3. Register the route in `app/router.tsx` with a lazy import of `@/pages/<name>`. A page that sits under another one gives its breadcrumbs, and a page with one main action for the whole page gives that action, in the route `handle` (`AdminPageHandle` from `widgets/admin-layout`); the layout shows both by the page title, from the deepest route that has them.
4. Put data loading in a loader and saving in an action in the page's `model` segment. Put reusable actions in `features`, and data models and requests in `entities`.
