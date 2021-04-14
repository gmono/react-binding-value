# example
react data-binding implementation,there is a example in Taro framework:
```tsx

import { binding, pack} from "react-binding-value"
function Test() {
    let [state, setState] = useState("test")
    let bindData = binding(useState("hello"))
    let MyComp = pack(Input).bind("value", "onInput", (v) => {
        return v.detail.value;
    }).bind("password","onInput",(v)=>{
        alert("change")
        return v==null;
    }).build();

    return (
        <MyComp  bind-password={binding(useState(false))} bind-value={binding([state,setState])} />
    )
}
```

# 说明
React的完整版的双向binding实现，自动实现属性增减，全面支持typescript提示与报错，强类型支持，支持自定义组件的自定义绑定，语法简洁与Vue和Blazor类似，支持多重事件（即用作双向binding的事件还可以作自定义binding，互不影响）,支持绑定多个属性到同一个事件上，支持提取函数和提取函数的复用（从事件参数中提取值），**满足你对双向绑定的所有幻想**
# 计划
未来还将支持绑定到其他组件的事件，进行交叉绑定，