//30.将watcher实例加到Dep.events中
class Dep {
  constructor() {
    this.events = [];
  }
  addWatcher(watcher) {
    this.events.push(watcher);
  }
}
//26.用于后续判断是否添加监听
Dep.target = null;

const dep = new Dep();

//25
class Watcher {
  constructor(cbk, data, key) {
    this.cbk = cbk;
    this.data = data;
    this.key = key;
    //27.将Watcher挂到Dep上
    Dep.target = this;
    this.init();
  }
  init() {
    //28.获取对应属性内容
    this.value = utils.getValue(this.data, this.key);
    console.log(this.value)
    //避免重复获取
    Dep.target = null;
    
    return this.value;
  }
  sendVal() {
    let newVal = this.init();
    // console.log(newVal)
    //31.设置值，触发劫持中的set
    this.cbk(newVal);
  }
}


//4.数据劫持，指的是在访问或者修改对象的某个属性时，通过一段代码拦截这个行为，进行额外的操作或者修改返回结果。
class Observer {
  constructor(data) {
    //5.判断，如果不是个对象直接返回
    if (typeof data !== "object") {
      return;
    }
    this.data = data;
    this.init();
  }
  init() {
    Object.keys(this.data).forEach(val => {
      //7.data下数据的劫持
      this.observer(this.data, val, this.data[val]);
    });
  }
  //6
  observer(obj, key, value) {
    // 通过递归实现每个属性的数据劫持
    new Observer(obj[key]);
    Object.defineProperty(obj, key, {
      get() {
        //29.
        if (Dep.target) {
          dep.addWatcher(Dep.target);
        }
        return value;
      },
      set(newVal) {
        value = newVal;
        //32.watcher设置，触发cbk()
        dep.events.forEach(item => {
          item.sendVal();
        });
        //设置的新的newVal也是一个对象,并添加劫持
        new Observer(value);
       
      }
    });
  }
}

//公用处理
const utils = {
  //18.把数据添加到
  getValue(data, key) {
    //找是否key包含.
    if (key.indexOf(".") > -1) {
      let keys = key.split(".");
      for (let i = 0; i < keys.length; i++) {
        data = data[keys[i]];
      }
      return data;
    } else {
      return data[key];
    }
  },
  //22.修改data ,与input关联
  changeVal(data, key, newVal) {
    if (key.indexOf(".") > -1) {
      let keys = key.split(".");
      for (let i = 0; i < keys.length - 1; i++) {
        //最后个对象
        data = data[keys[i]];
      }
      //最后对象中的属性
      data[keys[keys.length - 1]] = newVal;
    } else {
      data[key] = newVal;
    }
  }
};
// {
//   a:{
//     b:{
//       c；7
//     }
//   }
// }
// a.b.c


//1.实现数据的双向绑定
class Mvvm {
  //2
  constructor({ el, data }) {
    //el根节点，data数据，挂到实例上
    this.el = el;
    this.data = data;
    this.sameVal = "";
    this.init();
    this.initDom();
  }
  init() {
    //3.挂到实例上，进行数据劫持
    Object.keys(this.data).forEach(val => {
      this.observer(this, val, this.data[val]);
    });
    //data里面的对象也数据劫持
    new Observer(this.data);
  }
  observer(obj, key, value) {
    Object.defineProperty(obj, key, {
      //get获取
      get() {
        return value;
      },
      //set设置，先set后get
      set(newVal) {
        value = newVal;
      }
    });
  }
  initDom() {
    //8.获取根节点
    this.$el = document.getElementById(this.el);
    //创建一个碎片节点，减少页面重绘
    //11
    let newFragment = this.createFragment();
    //12.v-model对应变化
    this.compiler(newFragment);
    //把碎片节点添加到根节点上
    this.$el.appendChild(newFragment);
  }
  createFragment() {
    //9.创建一个空白碎片节点
    let newFragment = document.createDocumentFragment();
    let firstChild;
    //10.起到一个截取，打散的作用
    while ((firstChild = this.$el.firstChild)) {
      // console.log(firstChild)
      newFragment.appendChild(firstChild);
      // console.dir(newFragment)
    }
    // console.dir(newFragment)
    return newFragment;
  }
  compiler(node) {
    //console.dir(node)//打印对象
    //14
    if (node.nodeType === 1) {
      //为元素节点时
      // console.dir(node)
      //15获取节点上属性的集合，是一个伪数组
      let attributes = node.attributes;
      Array.from(attributes).forEach(item => {
        // console.dir(item)
        //16.当属性为v-model时
        if (item.nodeName === "v-model") {
          this.sameVal = item.nodeValue;
          //17.让input框显示v-model中属性对应内容
          node.value = utils.getValue(this.data, item.nodeValue);
          //21.监听input事件，修改对应newVal
          node.addEventListener("input", e => {
            //23.改变data中值
            utils.changeVal(this.data, item.nodeValue, e.target.value);
          });
        }
      });
    } else if (node.nodeType === 3) {
      //19. 获取{{}}中内容，空的为false
      let textContent =
        node.textContent.indexOf("{{") > -1 &&
        node.textContent.split("{{")[1].split("}}")[0];
      // console.log(textContent)
      if (textContent) {
        //20.完成页面渲染
        node.textContent = utils.getValue(this.data, textContent);
        //24,实例一个监听类
        new Watcher(
          newVal => {
            node.textContent = newVal;
          },
          this.data,
          textContent
        );
      }

      // //正则获取花括号内属性，key值
      // let rag=/(?<=\{)[^\{\}$]*(?=\})/g
      // let textContent = node.textContent.match(rag)
      // // console.log(textContent)
      // if (textContent) {
      //   node.textContent=''
      //   let that=this
      //   console.log(textContent)
      //   textContent.forEach(item=>{
      //     console.log(item)
      //     console.log('..')
      //     //取data值，放入文本节点
      //     node.textContent+=utils.getValue(this.data,item);
      //     let oldVal=node.textContent
      //     //将input与textContent联系起来，添加一个类watcher,监听
      //     new Watcher(function(newVal){
      //       if(textContent.length>1){
      //         if(item===this.sameVal){ 
      //           node.textContent=''
      //           let changeKey=utils.getValue(this.data,this.sameVal)
      //           newVal=changeKey
      //         }
      //         node.textContent+=newVal
      //       }else{
      //         if(item===this.sameVal){ 
      //           node.textContent=''
      //           let changeKey=utils.getValue(this.data,this.sameVal)
      //           newVal=changeKey
      //         }
      //         node.textContent=newVal
      //       }

      //       // console.log(node.textContent)
      //     }.bind(that),this.data,item)
      //   })

      // }
    }

    //13.通过递归的形式保证每一级的文本都可以获取到并替换
    if (node.childNodes && node.childNodes.length > 0) {
      node.childNodes.forEach(item => {
        this.compiler(item);
      });
    }
  }
}
