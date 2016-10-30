import { Observable } from "rxjs"

const a = Observable.range(1, 10)
const b = Observable.range(1, 5).map(x => x * 2)

//a.zip(b) .subscribe(console.log)

Observable.combineLatest(a, b, (a: any, b: any) => [a, b])
 //.subscribe(console.log)

const x = Observable.interval(2000).timeInterval().zip(a.map(x => x.toString()))
const y = Observable.interval(1000).timeInterval().zip(b.map(x => x.toString()))
//x.concat(y).subscribe(console.log)




const yahoo  = Observable.fromPromise(Promise.resolve("www.yahoo.co.jp"));
const google = Observable.fromPromise(Promise.resolve("www.google.co.jp"));

Observable.from([yahoo, google])
  .flatMap(x => x)
  .subscribe(console.log);

