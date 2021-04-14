# example
```tsx
let MyInput=pack(Input).bind("value","onChange",(e)=>e.target.value);
return <MyInput bind-value={binding([state,setState])}>
```