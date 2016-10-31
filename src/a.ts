import * as Rx from "rxjs"
import { Observable } from "rxjs"

const a = Observable.of(1, 3, 5)
const b = Observable.of(10, 10, 10)

//a.zip(b) .subscribe(console.log)

Observable.combineLatest(a, b, (a: any, b: any) => [a, b])
 //.subscribe(console.log)

const x = Observable.interval(2000).timeInterval().zip(a.map(x => x.toString()))
const y = Observable.interval(1000).timeInterval().zip(b.map(x => x.toString()))
//x.concat(y).subscribe(console.log)

a.mergeMap(x => Observable.of(10, 10, 10), (a, b) => a*b)
  //.subscribe(console.log);

var letters = Rx.Observable.of('a', 'b', 'c');
var result = letters.mergeMap(x =>
      Rx.Observable.interval(1000).map(i => x + i)
    )
    .subscribe(console.log);

