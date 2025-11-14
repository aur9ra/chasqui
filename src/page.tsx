import { useState, useEffect, useLayoutEffect } from 'preact/hooks'

/*
functions to handle the state of the cache
*/

// the ANCHOR_PAGE_CONTENT_CACHE is the browser's way of caching anchor links it comes across

// right now we don't need multiple copies of the page content cache.
// in the future, it may be wise to do so. however, as the current design
// philosophy of this project stands, the memory footprint of this will guaranteeably
// be quite low.

let ANCHOR_PAGE_CONTENT_CACHE = new Map<string, string>();

// currently, the functions associated with the cache are quite primitive, just calling
// various methods of the base ANCHOR_PAGE_CONTENT_CACHE as an abstraction.

async function cacheHrefContent(href: string) {
  if (ANCHOR_PAGE_CONTENT_CACHE.has(href)) {
    return;
  }
  let query = await queryHrefContent(href)

  ANCHOR_PAGE_CONTENT_CACHE.set(href, query)
}

async function queryHrefContent(href: string): Promise<string> {
  const uri = href.replace(".html", ".main.html");

  try {
    return fetch(uri).then(
      result => result.text()
    ).then(
      result => { return Promise.resolve(result) }
    )
  } catch (error: any) {
    return Promise.reject(error);
  }
}

async function getHrefContent(href: string): Promise<string> {
  // determine if the user is requesting at root
  if (ANCHOR_PAGE_CONTENT_CACHE.has(href)) {
    return ANCHOR_PAGE_CONTENT_CACHE.get(href) as string;
  } else {
    cacheHrefContent(href)
    let hrefContent = ANCHOR_PAGE_CONTENT_CACHE.get(href);

    return ANCHOR_PAGE_CONTENT_CACHE.get(href) as string;
  }
}

/*
functions to deal with the anchor tags in the page
*/

function getAnchorElements(doc: Document): Array<HTMLAnchorElement> {
  let arr = [];
  for (let i = 0; i < doc.links.length; i++) {
    arr.push(doc.links.item(i));
  }

  return arr.filter(ele => ele instanceof HTMLAnchorElement);
}

/*
page, main functionality. the Driver
*/

const getNormalHref = (href: string, pathname: string): string => {
  if (pathname === "/") {
    return href + "index.html";
  } else {
    return href;
  }
}

export function Page() {
  // determine if the user is clicking a link

  // when the user wants to nagivate
  // (clicking fwd/back button in browser, clicking link)
  // swap out the content for cached content
  // and appropriately update the history
  const handleNavigationEvent = (e: Event) => {
    e.preventDefault();

    if (e instanceof PopStateEvent) {
      const href = e.state.href;
      updatePageHref(href, false);
      // updatePageHref uses pushState, we need replaceState

      history.replaceState({ href: href }, "", href);
    }

    if (e instanceof PointerEvent) {
      const a = e.target!;
      if (a instanceof HTMLAnchorElement) {
        const href = getNormalHref(a.href, a.pathname);
        updatePageHref(href);
      }
    }
  }

  // when we update the page, we need to tell preact that we are now rerendering the page.
  // this is the main callback of the program.
  const [pageContent, _setPageContent] = useState(document.getElementById("app")!.innerHTML);
  const [initialLoad, _setInitialLoad] = useState(true);

  // when the page's href is updated, we should update the content of the page.
  const updatePageHref = (href: string, handle_state: boolean = true) => {
    _setInitialLoad(false);

    getHrefContent(href).then(
      html => {
        _setPageContent(html);

        if (handle_state) {
          history.pushState({ href: href }, "", href);
        }
      }
    );
  }

  // when loading the page, we need to add state to the history entry
  // the browser generates
  // 
  // we also need to add the event listener for popstate, i.e. fwd/back
  useEffect(() => {
    // set initial state 
    {
      const href = getNormalHref(window.location.href, window.location.pathname) // get the href of current location
      cacheHrefContent(href); // cache it (incase, say, user goes fwd -> back)
      history.replaceState({ href: href }, "", href); //insert href state info
    }

    // when the user presses fwd/back
    window.addEventListener("popstate", async (e: PopStateEvent) => {
      e.preventDefault();
      handleNavigationEvent(e);
    })

    // because we are loading this, we need to erase what was previously here
    // document.getElementById("app")!.innerHTML = "";
  }, []) // at runtime

  // when pageContent is available, before the browser renders
  // set the content seamlessly (removing the server side render)
  useLayoutEffect(() => {
    document.getElementById("app")!.innerHTML = pageContent;
  })

  // iterate over links (anchor elements) in the current document and cache the html main tag in plaintext
  useEffect(() => {
    getAnchorElements(document).map((a: HTMLAnchorElement) => {
      cacheHrefContent(a.href);
      a.addEventListener("click", handleNavigationEvent) // when this link is clicked, run the corresponding
      // function to handle the navigation event
    })


  }, [pageContent]); // when the content of the page changes

  return <div id="loaded_app">pageContent</div>;
};
