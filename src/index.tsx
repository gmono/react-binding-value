//双向绑定

//<input value={binding(useState())}
import * as React from "react"


export interface LinkedState<T> {
    readonly value: T;
    update(v: T):void;
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


export type PropsType<T extends React.ComponentType<any>> =
    (
        T extends React.ComponentClass<infer P, any> ? P :
        T extends React.FunctionComponent<infer P> ? P : never
    );

//把一个不支持binding格式的组件转换为支持binding格式
//!先假设有onChange
export interface BindingPropsInfo<CompType extends React.ComponentType<any>, updateEP extends (keyof PropsType<CompType>)> {
    key: (keyof PropsType<CompType>);
    updateEventnName?: updateEP;
    //提取函数 用于将事件发出的数据对象 转换为一个值用来更新
    getter?(...args): any;
}


class CLS<C extends React.ComponentType<any>> {
    constructor(private c:C){

    }
    nowList = [];
    public build(): C {
        return bindingPack(this.c, this.nowList) as any;
    }
    public bind<keyT extends (keyof PropsType<C>), updateEP extends (keyof PropsType<C>)>(key: keyT, updateEventName: updateEP,
        getter: (
            (v: Parameters<PropsType<C>[updateEP]>[0]) => PropsType<C>[keyT]
        )):CLS<React.ComponentType<Omit<PropsType<C>, keyT>>> {
        this.nowList.push({
            key,
            updateEventName,
            getter
        })
        //在类型中删除key表示的属性
        return this as CLS<React.ComponentType<Omit<PropsType<C>, keyT>>>;
    }
}
export function pack<CompType extends React.ComponentType<any>>(c: CompType) {
    // type Constructor<C>=C extends React.ComponentType<infer P>? (props:P)=>C:never;

    return new CLS<CompType>(c);

}


export function bindingPack<T extends React.ComponentType<any>>(Comp: T, bindKeys: (BindingPropsInfo<T, any> | (keyof PropsType<T>))[]) {
    //将制定的树形添加bind前缀属性
    //传入的是binding数组
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
                let eventname = desc.updateEventnName ?? "onInput";
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
                if ( typeof props[k] == "function") {
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
                else{
                    if(k in nprops) throw new Error("重复使用值属性");
                    nprops[k]=props[k];
                }
            }
        }
        console.log(nprops)
        return <Comp {...nprops} />
    }
}