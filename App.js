import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── HELPERS ────────────────────────────────────────────────────────────────
export const COUNTRIES = [
  { flag:'🇵🇰', name:'Pakistan',      code:'PK', currency:'PKR', symbol:'₨' },
  { flag:'🇺🇸', name:'United States', code:'US', currency:'USD', symbol:'$' },
  { flag:'🇬🇧', name:'United Kingdom',code:'GB', currency:'GBP', symbol:'£' },
  { flag:'🇩🇪', name:'Germany',       code:'DE', currency:'EUR', symbol:'€' },
  { flag:'🇫🇷', name:'France',        code:'FR', currency:'EUR', symbol:'€' },
  { flag:'🇮🇳', name:'India',         code:'IN', currency:'INR', symbol:'₹' },
  { flag:'🇧🇩', name:'Bangladesh',    code:'BD', currency:'BDT', symbol:'৳' },
  { flag:'🇦🇪', name:'UAE',           code:'AE', currency:'AED', symbol:'د.إ'},
  { flag:'🇸🇦', name:'Saudi Arabia',  code:'SA', currency:'SAR', symbol:'﷼' },
  { flag:'🇨🇦', name:'Canada',        code:'CA', currency:'CAD', symbol:'C$' },
  { flag:'🇦🇺', name:'Australia',     code:'AU', currency:'AUD', symbol:'A$' },
  { flag:'🇯🇵', name:'Japan',         code:'JP', currency:'JPY', symbol:'¥'  },
  { flag:'🇨🇳', name:'China',         code:'CN', currency:'CNY', symbol:'¥'  },
  { flag:'🇧🇷', name:'Brazil',        code:'BR', currency:'BRL', symbol:'R$' },
  { flag:'🇲🇽', name:'Mexico',        code:'MX', currency:'MXN', symbol:'$'  },
  { flag:'🇿🇦', name:'South Africa',  code:'ZA', currency:'ZAR', symbol:'R'  },
  { flag:'🇳🇬', name:'Nigeria',       code:'NG', currency:'NGN', symbol:'₦'  },
  { flag:'🇰🇪', name:'Kenya',         code:'KE', currency:'KES', symbol:'KSh'},
  { flag:'🇹🇷', name:'Turkey',        code:'TR', currency:'TRY', symbol:'₺'  },
  { flag:'🇷🇺', name:'Russia',        code:'RU', currency:'RUB', symbol:'₽'  },
  { flag:'🇰🇷', name:'South Korea',   code:'KR', currency:'KRW', symbol:'₩'  },
  { flag:'🇸🇬', name:'Singapore',     code:'SG', currency:'SGD', symbol:'S$' },
  { flag:'🇸🇪', name:'Sweden',        code:'SE', currency:'SEK', symbol:'kr' },
  { flag:'🇨🇭', name:'Switzerland',   code:'CH', currency:'CHF', symbol:'Fr' },
  { flag:'🇮🇩', name:'Indonesia',     code:'ID', currency:'IDR', symbol:'Rp' },
  { flag:'🇲🇾', name:'Malaysia',      code:'MY', currency:'MYR', symbol:'RM' },
  { flag:'🇵🇭', name:'Philippines',   code:'PH', currency:'PHP', symbol:'₱'  },
  { flag:'🇹🇭', name:'Thailand',      code:'TH', currency:'THB', symbol:'฿'  },
  { flag:'🇻🇳', name:'Vietnam',       code:'VN', currency:'VND', symbol:'₫'  },
  { flag:'🇪🇬', name:'Egypt',         code:'EG', currency:'EGP', symbol:'£'  },
  { flag:'🇲🇦', name:'Morocco',       code:'MA', currency:'MAD', symbol:'د.م.'},
  { flag:'🇮🇱', name:'Israel',        code:'IL', currency:'ILS', symbol:'₪'  },
  { flag:'🇦🇷', name:'Argentina',     code:'AR', currency:'ARS', symbol:'$'  },
  { flag:'🇨🇴', name:'Colombia',      code:'CO', currency:'COP', symbol:'$'  },
  { flag:'🇵🇱', name:'Poland',        code:'PL', currency:'PLN', symbol:'zł' },
  { flag:'🇺🇦', name:'Ukraine',       code:'UA', currency:'UAH', symbol:'₴'  },
  { flag:'🇬🇭', name:'Ghana',         code:'GH', currency:'GHS', symbol:'₵'  },
  { flag:'🇳🇿', name:'New Zealand',   code:'NZ', currency:'NZD', symbol:'NZ$'},
];

export const CATEGORIES = [
  { id:'Food',          label:'Food',          emoji:'🍔', color:'#ef4444' },
  { id:'Transport',     label:'Transport',     emoji:'🚌', color:'#3b82f6' },
  { id:'Shopping',      label:'Shopping',      emoji:'🛍️', color:'#ec4899' },
  { id:'Bills',         label:'Bills',         emoji:'💡', color:'#f59e0b' },
  { id:'Health',        label:'Health',        emoji:'🏥', color:'#22c55e' },
  { id:'Entertainment', label:'Entertainment', emoji:'🎬', color:'#a78bfa' },
  { id:'Salary',        label:'Salary',        emoji:'💼', color:'#6ee7b7' },
  { id:'Investment',    label:'Investment',    emoji:'📈', color:'#38bdf8' },
  { id:'Education',     label:'Education',     emoji:'📚', color:'#fb923c' },
  { id:'Other',         label:'Other',         emoji:'📦', color:'#94a3b8' },
];
export const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export const ACHIEVEMENTS_DEF = [
  { id:'first_tx',      icon:'🎉', name:'First Step',     desc:'Added first transaction'       },
  { id:'budget_master', icon:'🏆', name:'Budget Master',  desc:'Stayed under budget'            },
  { id:'goal_setter',   icon:'🎯', name:'Goal Setter',    desc:'Created a savings goal'         },
  { id:'halfway',       icon:'⭐', name:'Halfway!',        desc:'50% of a goal reached'          },
  { id:'goal_complete', icon:'🥇', name:'Goal Complete',  desc:'Completed a savings goal!'      },
  { id:'ten_txns',      icon:'📊', name:'Tracker Pro',    desc:'Added 10+ transactions'         },
  { id:'emergency',     icon:'🛡️', name:'Safety Net',     desc:'Started emergency fund'         },
  { id:'week_streak',   icon:'🔥', name:'Week Streak',    desc:'Tracked spending 7 days'        },
];

export const getDark = (d) => ({
  bg:      d ? '#0a0f1e' : '#f0f4ff',
  surface: d ? '#111827' : '#ffffff',
  surface2:d ? '#1a2235' : '#f8faff',
  surface3:d ? '#232f45' : '#eef2ff',
  border:  d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  text:    d ? '#f1f5f9' : '#0f172a',
  text2:   d ? '#94a3b8' : '#475569',
  text3:   d ? '#64748b' : '#94a3b8',
  accent:'#6ee7b7', accent2:'#3b82f6', accent3:'#f59e0b',
  red:'#ef4444', green:'#22c55e', yellow:'#eab308', purple:'#a78bfa',
});

export const fmt     = (n, s='$') => { const a=Math.abs(n||0); const str=a>=1e6?(a/1e6).toFixed(1)+'M':a>=1e3?(a/1e3).toFixed(1)+'K':a.toLocaleString(); return (n<0?'-':'')+s+str; };
export const fmtFull = (n, s='$') => s + Number(n||0).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0});
export const todayStr  = () => new Date().toISOString().split('T')[0];
export const thisMonth = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
export const getMonthTxns  = (t) => t.filter(x => x.date?.startsWith(thisMonth()));
export const getTodayTxns  = (t) => t.filter(x => x.date === todayStr());
export const getHourGreeting = () => { const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };

// ─── CONTEXT ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'budgetai_v1';
const init = {
  onboarded:false, name:'', country:null, monthlyBudget:0, monthlyIncome:0,
  pin:'', pinEnabled:true, biometricEnabled:false,
  transactions:[], goals:[], recurring:[], emergencyFund:0, emergencyTarget:0,
  darkMode:true, notifications:true, chatHistory:[], achievements:{},
};
function reducer(s, a) {
  switch(a.type) {
    case 'LOAD':             return { ...s, ...a.payload };
    case 'SET':              return { ...s, [a.key]: a.value };
    case 'ADD_TRANSACTION':  return { ...s, transactions:[a.tx, ...s.transactions] };
    case 'DELETE_TRANSACTION': return { ...s, transactions:s.transactions.filter(t=>t.id!==a.id) };
    case 'ADD_GOAL':         return { ...s, goals:[...s.goals, a.goal] };
    case 'UPDATE_GOAL':      return { ...s, goals:s.goals.map(g=>g.id===a.id?{...g,...a.updates}:g) };
    case 'DELETE_GOAL':      return { ...s, goals:s.goals.filter(g=>g.id!==a.id) };
    case 'ADD_RECURRING':    return { ...s, recurring:[...s.recurring, a.item] };
    case 'DELETE_RECURRING': return { ...s, recurring:s.recurring.filter(r=>r.id!==a.id) };
    case 'ADD_CHAT':         return { ...s, chatHistory:[...s.chatHistory.slice(-30), a.msg] };
    case 'CLEAR_CHAT':       return { ...s, chatHistory:[] };
    case 'EARN_ACHIEVEMENT': return { ...s, achievements:{...s.achievements,[a.id]:true} };
    default: return s;
  }
}
const AppContext = createContext(null);
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then(d => { if(d) dispatch({type:'LOAD',payload:JSON.parse(d)}); }); }, []);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}
export const useApp = () => useContext(AppContext);

// ─── NAVIGATOR ──────────────────────────────────────────────────────────────
import HomeScreen     from './screens1';
import ScreensGroup2  from './screens2';
import SettingsScreen from './screens3';

const { TransactionsScreen, ReportsScreen } = ScreensGroup2;
const { GoalsScreen, AIScreen } = ScreensGroup2;

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const { state } = useApp();
  const T = getDark(state.darkMode);
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle:{ backgroundColor:T.surface, borderTopColor:T.border, borderTopWidth:1, paddingBottom:8, paddingTop:6, height:64 },
      tabBarActiveTintColor: T.accent,
      tabBarInactiveTintColor: T.text3,
      tabBarLabelStyle:{ fontSize:10, fontWeight:'700' },
      tabBarIcon:({ focused, color }) => {
        const icons = { Home: focused?'home':'home-outline', Transactions: focused?'wallet':'wallet-outline', Reports: focused?'bar-chart':'bar-chart-outline', Goals: focused?'trophy':'trophy-outline', AI: focused?'chatbubble-ellipses':'chatbubble-ellipses-outline' };
        return <Ionicons name={icons[route.name]} size={22} color={color} />;
      },
    })}>
      <Tab.Screen name="Home"         component={HomeScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Reports"      component={ReportsScreen} />
      <Tab.Screen name="Goals"        component={GoalsScreen} />
      <Tab.Screen name="AI"           component={AIScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { state } = useApp();
  const [locked, setLocked]   = useState(false);
  const [loading, setLoading] = useState(true);
  const T = getDark(state.darkMode);
  useEffect(() => { setTimeout(() => { setLoading(false); if(state.onboarded && state.pinEnabled && state.pin) setLocked(true); }, 300); }, []);
  if(loading) return <View style={{flex:1,backgroundColor:T.bg,justifyContent:'center',alignItems:'center'}}><ActivityIndicator color={T.accent} size="large"/></View>;
  if(!state.onboarded) { const { OnboardingScreen } = require('./screens3'); return <OnboardingScreen />; }
  if(locked) { const { LockScreen } = require('./screens3'); return <LockScreen onUnlock={() => setLocked(false)} />; }
  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      <Stack.Screen name="Main"     component={MainTabs} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation:'modal' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex:1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
