//双向绑定

//<input value={binding(useState())}
import * as React from "react"

/**
 * 状态连接描述
 * 一个组件可以直接接收它并命名为bind-xxx格式，这样不需要包装可以直接使用
 * 类似vue中的xxx.sync协议
 */
export interface LinkedState<T> {
    readonly value: T;
    update(v: T): void;
}
export function binding<S>(state: [S, React.Dispatch<React.SetStateAction<S>>]): LinkedState<S> {
    //把一个状态打包成link格式
    return {
        get value() {
            return state[0];
        },
        update(v) {
            state[1](v);
        }
    }
}


/**
 * 用于bind 对象的成员，这里假设直接修改成员就会触发渲染，并设对应成员有set监听器
 * 自行监听并启动重渲染，多用于useValue 和 mobx store的属性binding
 * @param obj 对象
 * @param key key
 * @returns 一个binding对象
 */
export function prop<T, K extends keyof T>(obj: T, key: K) {
    let prev=undefined;
    return binding([obj[key], (v) => {
        let vv=null;
        if(v instanceof Function){
            vv=v(prev)
        }else vv=v;
        obj[key]=vv;
        //prev
        prev=vv;
    }]);
}

export type PropsType<T extends React.ComponentType<any>> =
    (
        T extends React.ComponentClass<infer P, any> ? P :
        T extends React.FunctionComponent<infer P> ? P : never
    );


/**
 * 属性转换描述符
 * 用来描述如何把一个非bind属性转换为bind属性
 */
export interface BindingPropsInfo<CompType extends React.ComponentType<any>, updateEP extends (keyof PropsType<CompType>)> {
    key: (keyof PropsType<CompType>);
    updateEventName?: updateEP;
    //提取函数 用于将事件发出的数据对象 转换为一个值用来更新
    getter?(...args): any;
}
export function empty(){
    return {
        value:null,
        update(){}
    }
}
/**
 * 构造者类
 * 为了满足必须类型，这里选择把事件变为可选，而bind的值必须赋值，如果没有，就给与empty赋值
 */
class CLS<C extends React.ComponentType<any>> {
    constructor(private c: C) {

    }
    nowList = [];
    public build(): C {
        return bindingPack(this.c, this.nowList) as any;
    }
    //限制 key必须是string类型 number和symbol暂不支持
    public bind<keyT extends (keyof PropsType<C> & string), updateEP extends (keyof PropsType<C>)>(key: keyT, updateEventName: updateEP,
        getter: (
            (v: Parameters<PropsType<C>[updateEP]>[0]) => PropsType<C>[keyT]
        ))
        //这是返回值设置 bind函数的 转换过的key变为bind-key类型变为 LinkState
        : CLS<React.ComponentType<Omit<PropsType<C>, keyT|updateEP>&{[k in updateEP]?:PropsType<C>[updateEP]} & Record<PrefixOr<keyT>, LinkedState<PropsType<C>[keyT]>>>> {
        this.nowList.push({
            key,
            updateEventName,
            getter
        })
        //在类型中删除key表示的属性
        return this as any;
    }
}
/**
 * 包装一个组件允许对其进行属性绑定设置，把非bind属性转换为bind属性（双向binding）
 * @param c 组件
 * @returns 包装器
 */
export function pack<CompType extends React.ComponentType<any>>(c: CompType) {
    // type Constructor<C>=C extends React.ComponentType<infer P>? (props:P)=>C:never;

    return new CLS<CompType>(c);

}

// type ToObject<T extends string>=T extends (infer A|any)? A:never;
// type test=ToObject<"a"|"b">

type ToOr<T extends any[]> = T extends [infer P, ...infer PP] ? P | ToOr<PP> : never;
type ToRecord<T extends string> = { [k in T]: any };

// type test2=ToOr<["1","2"]>
//反向推导函数 把对象转换为key的组合 其中s类型是所有key的组合
function GetKey<p extends [any, ...any[]], s extends string = ToOr<p>>(args: { [idx in s]: any }) {
    return null as s;
}

/**
 * 对一个对象添加前缀
 * @param args 用来确定类型的参数 反向推导
 * @returns null
 */
function PrefixObjKeys<p extends [any, ...any[]], s extends string = ToOr<p>>(args: { [idx in s]: any }) {
    return null as PrefixObjectKeys<s>;
}
// let a=PrefixObjKeys({a:1})
// a["bind-a"]
// type b=typeof a;
//此处b提取了对象中的key
// type k=ToRecord<b>;
//此时k重新被转换为对象
//此处实现把或元祖的字符串添加前缀
type PrefixTuple<T extends string[]> =
    T extends [infer P, ...infer PP] ? (
        //断言并转换
        P extends string ?
        PP extends [] ? [`bind-${P}`] : PP extends string[] ?
        [`bind-${P}`, ...PrefixTuple<PP>] : never : never
    ) : (T extends [infer P] ? P extends string ? [`bind-${P}`] : never : never);

//实现把对象的key提取出来 转换为元祖 添加
type PrefixOr<T extends string | number> = `bind-${T}`;
type PrefixObjectKeys<T extends ReturnType<typeof GetKey>> = ToRecord<PrefixOr<T>>;

//把obj key提取出来 添加前缀 再重新转换成obj
//不能直接使用 可以按照代码自己写来使用
// function prefixObjectKeys<T extends {[idx:string]:any}>(obj:T){
//     let keys=GetKey(obj);
//     return null as PrefixObjectKeys<typeof keys>;
// }

//必须是getkey函数的返回值类型
//此处两行生效
// let aa=GetKey({b:1,c:3});
// type ttt=PrefixObjectKeys<typeof aa>;

function test() {

}
// let t=prefixObjectKeys({a:1});

// type ss=keyof typeof t;

// type s=PrefixTuple<["a","b"]>
//实现从对象到keys的或形式
//添加bind-value 提示，1 获取所有bindkeys中的key，为a|b形式，2 拥有把a|b转换为{a:x,b:x}的形式 3 把a|b转换为bind-a|bind-b

/**
 * 绑定包装 理论上支持多重绑定 即bind-bind-data 来实现自动事件切换
 * @param Comp 组件
 * @param bindKeys key列表或绑定描述列表
 * @returns 高阶组件
 */
function bindingPack<T extends React.ComponentType<any>>(Comp: T, bindKeys: (BindingPropsInfo<T, any> | (keyof PropsType<T>))[]) {
    //将制定的树形添加bind前缀属性
    //传入的是binding数组
    //暂不支持修改前缀（因为要匹配类型设定）
    const prefix = 'bind-';
    let keys = bindKeys.map(v => typeof v == "string" ? { key: v } : v) as BindingPropsInfo<T, any>[];
    let bkeys = keys.map(v => v.key);
    return (props: any) => {
        //bind前缀的属性 在keys中的
        let nprops = {} as any;
        for (let k in props) {
            console.log(bkeys)
            if (k.startsWith(prefix) && bkeys.includes(k.slice(prefix.length))) {
                console.log(k)
                //是绑定属性
                //转换
                let rk = k.slice(prefix.length);
                let rv = (props[k] as LinkedState<any>).value;
                nprops[rk] = rv;
                //添加事件
                //找到与当前属性一样的描述符 获取记录的事件名
                let desc = keys.find(v => v.key == rk);
                //默认使用onChange事件
                let eventname = desc.updateEventName ?? "onChange";
                //添加事件
                console.log('aaa')
                function addEvent() {
                    nprops[eventname].funcs.push((...args) => {
                        //绑定事件 用来调用更新函数
                        let ent = (props[k] as LinkedState<any>);
                        let val = args[0];
                        if (desc.getter != null) {
                            //有定义 提取
                            val = desc.getter(...args);
                        }
                        ent.update(val);
                    })
                }
                if (eventname in nprops) {
                    //已经有这个事件
                    addEvent();
                }
                else {
                    let hubfunc = (...args) => {
                        for (let a of (hubfunc as any).funcs) {
                            //忽略返回值
                            a(...args);
                        }
                    }
                    (hubfunc as any).funcs = []
                    //nprops
                    nprops[eventname] = hubfunc;
                    //
                    addEvent();
                }
            }
            else {
                if (typeof props[k] == "function") {
                    if (k in nprops) {
                        //这里确定一定是函数了
                        if (typeof nprops[k] != "function") {
                            throw new Error();
                        }
                        else nprops[k].funcs.push(props[k])
                    } else {
                        //创建集线器
                        let eventname = k
                        let hubfunc = (...args) => {
                            for (let a of (hubfunc as any).funcs) {
                                //忽略返回值
                                a(...args);
                            }
                        }
                        (hubfunc as any).funcs = []
                        //nprops
                        nprops[eventname] = hubfunc;
                        (hubfunc as any).funcs.push(props[k])
                    }
                }
                else {
                    if (k in nprops) throw new Error("重复使用值属性");
                    nprops[k] = props[k];
                }
            }
        }
        console.log(nprops)
        return <Comp {...nprops} />
    }
}