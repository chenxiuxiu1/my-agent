import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { themeStorage } from './utils/storage.js'

// 导入Vant组件
import { 
  Button, 
  Search, 
  Tabs, 
  Tab, 
  Icon, 
  Tag, 
  Popup, 
  Picker,
  Cell,
  CellGroup,
  Switch,
  Field,
  Checkbox,
  CheckboxGroup,
  DropdownMenu,
  DropdownItem,
  NavBar,
  Tabbar,
  TabbarItem,
  PullRefresh,
  List,
  Skeleton,
  Empty,
  Dialog,
  Toast,
  ActionSheet
} from 'vant'

// 导入Vant样式
import 'vant/lib/index.css'

// 导入全局样式
import './styles/global.scss'

// 初始化主题
themeStorage.init()

const app = createApp(App)

// 注册Vant组件
app.use(Button)
app.use(Search)
app.use(Tabs)
app.use(Tab)
app.use(Icon)
app.use(Tag)
app.use(Popup)
app.use(Picker)
app.use(Cell)
app.use(CellGroup)
app.use(Switch)
app.use(Field)
app.use(Checkbox)
app.use(CheckboxGroup)
app.use(DropdownMenu)
app.use(DropdownItem)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(PullRefresh)
app.use(List)
app.use(Skeleton)
app.use(Empty)
app.use(Dialog)
app.use(Toast)
app.use(ActionSheet)

app.use(router)

app.mount('#app')
