import * as Rx from "rxjs"

const a = Rx.Observable.range(1, 10)
const b = Rx.Observable.range(1, 10).map(x => x * 2)

a.zip(b)
  .subscribe(console.log)
