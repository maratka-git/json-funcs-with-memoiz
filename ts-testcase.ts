
/*
 * input data:
 * https://jsonplaceholder.typicode.com/todos 
 * https://jsonplaceholder.typicode.com/users
 */

//  interfaces for todos.json file:
interface Todo {
  id: number;
  title: string;
  completed: boolean;
}
interface UserTodo extends Todo {
  userId: number;
}
// interface for task #4 in exercise 2:
// `load data about selected todos' authors and print result to console:`
interface AuthorTodo extends UserTodo {
  author: string;
}
//  interfaces for users.json:
interface Geo {
  lat: string;
  lng: string;
}
interface Address extends Geo {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
}
interface Company {
  name: string;
  catchPhrase: string;
  bs: string;
}
interface User extends Address, Company {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
    website: string;
}

// overall class v2:
class UsersTodos_v2 {
  protected todos_url : string;
  protected users_url : string;
  public memo : any;

  constructor(todos : string, users : string) {
    this.todos_url = todos;
    this.users_url = users;
    this.memo = {};
  }
  //  memo stuff:
  public getKeySha256 = async (fn : Function, ...args: any[]): Promise<string> => {
  const str = [fn, ...args].toString();
//      console.log("getKeySha256: ", str);
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  const res = Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
  return res.toString();
  }
  ////  RunAndMemo:
  RunAndMemo = async (selectFn : Function, ...args: any[]) : Promise<{} | undefined> => {
    const key: string = await this.getKeySha256(selectFn, args);
    //console.log(`enter RunAndMemo, key: ${key}, data: ${this.memo[key]}`);
    if (this.memo[key]) {
      console.log(`RunAndMemo, found, return memoized for ${key}`);//, this.memo[key]);
      return this.memo[key];
    }
    console.log(`RunAndMemo, run selectFn for key: ${key}`);
    this.memo[key] = await selectFn(...args);;
    return this.memo[key];
  }
  //  return memoized:
  ReturnMemoByKey (key: string) : any[] {
    return this.memo[key];
  }
  ReturnMemoByFunc = async (selectFn : Function, ...args: any[]) : Promise<{} | undefined> => {
    const key: string = await this.getKeySha256(selectFn, args);
    return this.memo[key];
  }
  //  Unmemo:
  UnmemoByKey (key: string) : void {
    this.memo[key] = undefined;
  }
  UnmemoByFunc = async (selectFn : Function, ...args: any[]) : Promise<void> => {
    const key: string = await this.getKeySha256(selectFn, args);
    console.log(`UnmemoByFunc, unmemo for ${key}`);
    this.memo[key] = undefined;
  }

  //  select funcs:  
  selectAll = async (): Promise<UserTodo[] | undefined> => {
    try {
   let data = await fetch(this.todos_url);
    if (!data.ok)
      throw `error fetching data from: ${this.todos_url} in SelectAll method`;
    return await data.json();
    } 
    catch(e) { 
      console.log(`There has been a problem with ${this.todos_url} method: ${e.message}`); 
      return undefined; 
    }
  }
  selectById = async (id: number): Promise <UserTodo | undefined> => {
    try {
      let data = await fetch(this.todos_url);
      if (!data.ok)
        throw "error fetching data from:" + this.todos_url + "in selectById method";
        let res = await data.json();
        return res.filter((todos: UserTodo) => todos.id === id);
    } catch(e) { 
      console.log('There has been a problem with selectById method: ' + e.message);
      return undefined; 
    }
  }
  selectAllTodosByUserId = async (userId: number): Promise<Todo[]|undefined> => {
    try {
      let data = await fetch(this.todos_url);
      if (!data.ok)
        throw "error fetching data from:" + this.todos_url + "in selectAllTodosByUserId method";
        const res1: UserTodo[] = await data.json();
        return res1.reduce ((res: any, cur: UserTodo) => {
          const { userId, ...td } = cur;
            if (!res[cur.userId])
              res[cur.userId] = [];
            res[cur.userId].push(td);
            return res;
          }, {})[userId];
    } 
    catch(e) { 
      console.log('There has been a problem with selectAllTodosByUserId method: ' + e.message);
      return undefined; 
    }
  }
  //  helper func GetIdByUsername:
  getIdByUsername = async (uname : string): Promise<number | undefined> => {
    try {
      let data = await fetch(this.users_url);
      if (!data.ok)
        throw "error fetching data from: ${this.users_url} in GetIdByUsername method";
      const res: User [] = await data.json();
      let res2 = res.find((u: User) => u.username === uname);
      if (res2 !== undefined)  
        return res2.id;
      return undefined;
    } catch(e) { 
      console.log('There has been a problem with GetIdByUsername' + e.message);
      return undefined; 
    }
  }
  // 3. select todos by user name:
  selectAllTodosByUsername = async (uname : string): Promise<Todo[]|undefined> => {
    const res = await this.getIdByUsername(uname);
    if (res !== undefined)
      return await this.selectAllTodosByUserId(res);
    return undefined;
  }
  // 4. Use https://jsonplaceholder.typicode.com/users to load data about 
  // selected todos' authors and print result to console:
  // (implemented as i understand it)
  loadTodosAuthors = async (utds : UserTodo[]|undefined): Promise<AuthorTodo[]|undefined> => {
   try {
     if (utds === undefined)
      return undefined; 
      // load users:
      const users = await fetch(this.users_url);
      if (!users.ok)
        throw `error fetching data from: ${this.users_url} in getAuthorByTodo`;
      const res: User [] = await users.json();
      // todos' with authors arr:
      let authors : AuthorTodo[] = [];
      // for all ids - get authors:
    for (const cur of utds) {
      const found = res.find((u: User) => cur.userId === u.id);
      if (found !== undefined) {
        authors.push({...cur, author: found.name });
      }
    }
      return authors; 
    } catch(e) { 
      console.log('There has been a problem with loadTodosAuthors' + e.message);
      return undefined; 
    }
  }
}

let c = new UsersTodos_v2 ("https://jsonplaceholder.typicode.com/todos", "https://jsonplaceholder.typicode.com/users");
//  1. tests for select funcs:
//c.selectAll().then((res) => console.log(res));
//c.selectById(2).then((res) => console.log(res));
//c.selectAllTodosByUserId(8).then((res) => console.log(res));
//c.getIdByUsername("Maxime_Nienow").then((res) => console.log(res));
//c.selectAllTodosByUsername("Moriah.Stanton").then(res => console.log(res));
//c.selectAll().then((res) => { c.loadTodosAuthors(res).then(out => console.log(out)) }); // load authors for all todos

//  2. tests for memorizing:
/*
const sel0 = c.selectAll;
//  2a. test for memoized value (selectAll):
//c.RunAndMemo(sel0).then(() => { c.ReturnMemoByFunc(sel0).then((res) => console.log(res)); }); 

//  2b. test for return memoized (repeated calls):
c.RunAndMemo(sel0).then(() => { c.RunAndMemo(sel0).then(()=> {}) });
*/
/*
//  2a. test for memoized value (selectById):
const sel1 = c.selectById;
c.RunAndMemo(sel1, 2).then(() => { c.ReturnMemoByFunc(sel1, 2).then((res) => console.log(res)); });
*/

//  2a. test for memoized value (selectAllTodosByUserId), and so on (hope those work too)
const sel2 = c.selectAllTodosByUserId;
//c.RunAndMemo(sel2, 2).then(() => { c.ReturnMemoByFunc(sel2, 2).then((res) => console.log(res)); });

//  same with chaining:
c.RunAndMemo(sel2, 2)
  .then(() => c.ReturnMemoByFunc(sel2, 2))
  .then((res) => console.log(res));  //  print memoized data

//  2c. test for unmemo (with chaining):
/*
const sel2 = c.selectAllTodosByUserId;
c.RunAndMemo(sel2, 2)
  .then(() => c.UnmemoByFunc(sel2, 2))  //  unmemo it
  .then(() => c.ReturnMemoByFunc(sel2, 2).then((res) => console.log(res)));  //  will be undefined
*/

