import * as Rx from "rxjs"
import { Observable } from "rxjs"
import 'rxjs/add/operator/debounce'

const a = Rx.Observable.of('a', 'b', 'c');
const b = Rx.Observable.of(10, 20, 30);

a
  .timeInterval(Rx.Scheduler.async)
  .subscribe(console.log);
