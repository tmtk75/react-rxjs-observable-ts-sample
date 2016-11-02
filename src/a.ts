import * as Rx from "rxjs"
import { Observable } from "rxjs"
import 'rxjs/add/operator/debounce'
/*
import { Kii, KiiUser } from "kii-sdk"

Kii.initializeWithSite("2cdc6549", "3dbc623c48196a1d61ef039996a40519", "https://api-development-jp.internal.kii.com/api")

Observable.fromPromise(KiiUser.authenticate("tmtk75", "abc123"))
  .subscribe(console.log)
*/

const ENTER = {};

Rx.Observable.fromEvent(document, 'keypress')
  .filter((e: any) => e.target.tagName !== 'INPUT')
  .filter(e => e.charCode || e.keyCode === 13)
  .map((e) => e.keyCode === 13 ? ENTER : String.fromCharCode(e.charCode))
  .buffer(
    Rx.Observable.fromEvent(document, 'keypress')
    .debounceTime(100)
  )
  //.filter((chars) => chars && chars.length > 1 && ( chars[chars.length - 1] === ENTER))
  .map((chars) => chars.slice(0, -1).join(''))
  .subscribe((events: any) => {
    console.log(events);
  });
