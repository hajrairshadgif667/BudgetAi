// screens3.js — Onboarding, LockScreen, Settings
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, FlatList, KeyboardAvoidingView, Platform, Switch, Alert, Vibration, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useApp, getDark, COUNTRIES, fmtFull, getHourGreeting } from './App';

const { width } = Dimensions.get('window');
const PIN_KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
export function OnboardingScreen() {
  const { dispatch } = useApp();
  const T = getDark(true);
  const [step,setStep]=useState(1);
  const [name,setName]=useState('');
  const [selCountry,setSelCountry]=useState(null);
  const [search,setSearch]=useState('');
  const [budget,setBudget]=useState('');
  const [income,setIncome]=useState('');
  const [pin,setPin]=useState('');
  const [confirmPin,setConfirmPin]=useState('');
  const [pinStep,setPinStep]=useState('set');
  const [error,setError]=useState('');

  const filtered=COUNTRIES.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.currency.toLowerCase().includes(search.toLowerCase()));

  function handlePin(k){
    setError('');
    const cur=pinStep==='set'?pin:confirmPin;
    const setter=pinStep==='set'?setPin:setConfirmPin;
    if(k==='⌫'){setter(cur.slice(0,-1));}
    else if(k==='✓'){
      if(cur.length!==4){setError('Enter 4 digits');return;}
      if(pinStep==='set'){setPinStep('confirm');}
      else{
        if(pin!==confirmPin){setError('PINs do not match');setConfirmPin('');setPinStep('set');setPin('');}
        else{
          dispatch({type:'SET',key:'name',value:name.trim()});
          dispatch({type:'SET',key:'country',value:selCountry});
          dispatch({type:'SET',key:'monthlyBudget',value:parseFloat(budget)||0});
          dispatch({type:'SET',key:'monthlyIncome',value:parseFloat(income)||0});
          dispatch({type:'SET',key:'pin',value:pin});
          dispatch({type:'SET',key:'pinEnabled',value:true});
          dispatch({type:'SET',key:'darkMode',value:true});
          dispatch({type:'SET',key:'onboarded',value:true});
        }
      }
    } else if(cur.length<4){setter(cur+k);}
  }

  function next(){
    setError('');
    if(step===1){if(!name.trim()){setError('Please enter your name');return;}setStep(2);}
    else if(step===2){if(!selCountry){setError('Please select a country');return;}setStep(3);}
    else if(step===3){if(!budget||!income){setError('Please fill both fields');return;}setStep(4);}
  }

  const curPin=pinStep==='set'?pin:confirmPin;

  return (
    <SafeAreaView style={{flex:1,backgroundColor:T.bg}}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView contentContainerStyle={s.obContainer} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={['#6ee7b7','#3b82f6']} style={s.obLogo} start={{x:0,y:0}} end={{x:1,y:1}}><Text style={{fontSize:40}}>💰</Text></LinearGradient>
          <Text style={[s.obTitle,{color:T.text}]}>BudgetAI</Text>
          <Text style={{color:T.text2,fontSize:14,marginTop:4,marginBottom:20}}>Your smart financial companion</Text>
          <View style={{flexDirection:'row',gap:8,marginBottom:20}}>
            {[1,2,3,4].map(n=><View key={n} style={{width:32,height:6,borderRadius:3,backgroundColor:n<=step?T.accent:T.surface3}}/>)}
          </View>
          <View style={[s.obCard,{backgroundColor:T.surface,borderColor:T.border}]}>
            {step===1&&<>
              <Text style={[s.obCardTitle,{color:T.text}]}>👋 What's your name?</Text>
              <Text style={{color:T.text2,fontSize:13,marginBottom:16,lineHeight:20}}>We'll personalize your experience</Text>
              <TextInput style={[s.inp,{backgroundColor:T.surface2,borderColor:T.border,color:T.text}]} value={name} onChangeText={setName} placeholder="e.g. Hajra" placeholderTextColor={T.text3} autoFocus/>
              {!!error&&<Text style={s.err}>{error}</Text>}
              <TouchableOpacity onPress={next}><LinearGradient colors={['#6ee7b7','#3b82f6']} style={s.btnGrad} start={{x:0,y:0}} end={{x:1,y:1}}><Text style={s.btnTxt}>Continue →</Text></LinearGradient></TouchableOpacity>
            </>}
            {step===2&&<>
              <Text style={[s.obCardTitle,{color:T.text}]}>🌍 Select Country</Text>
              <Text style={{color:T.text2,fontSize:13,marginBottom:12}}>Currency will be set automatically</Text>
              <TextInput style={[s.inp,{backgroundColor:T.surface2,borderColor:T.border,color:T.text,marginBottom:10}]} value={search} onChangeText={setSearch} placeholder="🔍 Search..." placeholderTextColor={T.text3}/>
              <View style={{maxHeight:240}}>
                <FlatList data={filtered} keyExtractor={c=>c.code} numColumns={2} columnWrapperStyle={{gap:8,marginBottom:8}} nestedScrollEnabled
                  renderItem={({item:c})=>(
                    <TouchableOpacity style={[s.countryItem,{backgroundColor:T.surface2,borderColor:selCountry?.code===c.code?T.accent:T.border}]} onPress={()=>setSelCountry(c)}>
                      <Text style={{fontSize:22}}>{c.flag}</Text>
                      <Text style={{color:T.text,fontSize:11,fontWeight:'700',marginTop:3}}>{c.name}</Text>
                      <Text style={{color:T.text2,fontSize:10}}>{c.currency} {c.symbol}</Text>
                    </TouchableOpacity>
                  )}/>
              </View>
              {!!error&&<Text style={s.err}>{error}</Text>}
              <View style={{flexDirection:'row',gap:8,marginTop:8}}>
                <TouchableOpacity style={[s.btnGhost,{flex:1,borderColor:T.border,backgroundColor:T.surface2}]} onPress={()=>setStep(1)}><Text style={{color:T.text2,fontWeight:'700',textAlign:'center'}}>← Back</Text></TouchableOpacity>
                <TouchableOpacity style={{flex:2}} onPress={next}><LinearGradient colors={['#6ee7b7','#3b82f6']} style={s.btnGrad} start={{x:0,y:0}} end={{x:1,y:1}}><Text style={s.btnTxt}>Continue →</Text></LinearGradient></TouchableOpacity>
              </View>
            </>}
            {step===3&&<>
              <Text style={[s.obCardTitle,{color:T.text}]}>💰 Set Your Budget</Text>
              <Text style={{color:T.text2,fontSize:13,marginBottom:16}}>In {selCountry?.currency} ({selCountry?.symbol})</Text>
              {[{l:'MONTHLY INCOME',v:income,s:setIncome,p:'e.g. 80000'},{l:'MONTHLY BUDGET',v:budget,s:setBudget,p:'e.g. 50000'}].map(f=>(
                <View key={f.l}>
                  <Text style={{color:T.text2,fontSize:11,fontWeight:'700',marginBottom:6,letterSpacing:0.6}}>{f.l}</Text>
                  <TextInput style={[s.inp,{backgroundColor:T.surface2,borderColor:T.border,color:T.text}]} value={f.v} onChangeText={f.s} placeholder={f.p} placeholderTextColor={T.text3} keyboardType="numeric"/>
                </View>
              ))}
              {!!error&&<Text style={s.err}>{error}</Text>}
              <View style={{flexDirection:'row',gap:8,marginTop:4}}>
                <TouchableOpacity style={[s.btnGhost,{flex:1,borderColor:T.border,backgroundColor:T.surface2}]} onPress={()=>setStep(2)}><Text style={{color:T.text2,fontWeight:'700',textAlign:'center'}}>← Back</Text></TouchableOpacity>
                <TouchableOpacity style={{flex:2}} onPress={next}><LinearGradient colors={['#6ee7b7','#3b82f6']} style={s.btnGrad} start={{x:0,y:0}} end={{x:1,y:1}}><Text style={s.btnTxt}>Continue →</Text></LinearGradient></TouchableOpacity>
              </View>
            </>}
            {step===4&&<>
              <Text style={[s.obCardTitle,{color:T.text}]}>🔒 {pinStep==='set'?'Set PIN':'Confirm PIN'}</Text>
              <Text style={{color:T.text2,fontSize:13,marginBottom:16,lineHeight:20}}>{pinStep==='set'?'Choose a 4-digit PIN to secure your app':'Re-enter your PIN to confirm'}</Text>
              <View style={{flexDirection:'row',gap:16,justifyContent:'center',marginVertical:16}}>
                {[0,1,2,3].map(i=><View key={i} style={{width:18,height:18,borderRadius:9,backgroundColor:i<curPin.length?T.accent:T.surface3,borderWidth:2,borderColor:i<curPin.length?T.accent:T.text3}}/>)}
              </View>
              {!!error&&<Text style={[s.err,{marginBottom:8}]}>{error}</Text>}
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center',marginBottom:16}}>
                {PIN_KEYS.map(k=>(
                  <TouchableOpacity key={k} style={[s.pinKey,{backgroundColor:T.surface2,borderColor:T.border}]} onPress={()=>handlePin(k)}>
                    <Text style={{fontSize:22,fontWeight:'700',color:k==='✓'?T.accent:T.text}}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[s.btnGhost,{borderColor:T.border,backgroundColor:T.surface2}]} onPress={()=>setStep(3)}><Text style={{color:T.text2,fontWeight:'700',textAlign:'center'}}>← Back</Text></TouchableOpacity>
            </>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── LOCK SCREEN ──────────────────────────────────────────────────────────────
export function LockScreen({ onUnlock }) {
  const { state } = useApp();
  const T = getDark(true);
  const [pin,setPin]=useState('');
  const [error,setError]=useState('');
  const [attempts,setAttempts]=useState(0);

  useEffect(()=>{ if(state.biometricEnabled) tryBio(); },[]);

  async function tryBio(){
    try{const r=await LocalAuthentication.authenticateAsync({promptMessage:'Authenticate to open BudgetAI',fallbackLabel:'Use PIN'});if(r.success)onUnlock();}catch(e){}
  }

  function handleKey(k){
    setError('');
    if(k==='⌫'){setPin(p=>p.slice(0,-1));}
    else if(k==='✓'){
      if(pin.length!==4){setError('Enter 4 digits');return;}
      if(pin===state.pin){onUnlock();}
      else{const a=attempts+1;setAttempts(a);Vibration.vibrate(300);setError(a>=3?'Too many attempts. Wait 30s.':'Incorrect PIN. Try again.');setPin('');if(a>=3)setTimeout(()=>{setAttempts(0);setError('');},30000);}
    } else if(pin.length<4){setPin(p=>p+k);}
  }

  return (
    <SafeAreaView style={{flex:1,backgroundColor:'#0a0f1e'}}>
      <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:32}}>
        <LinearGradient colors={['#6ee7b7','#3b82f6']} style={{width:90,height:90,borderRadius:28,alignItems:'center',justifyContent:'center',marginBottom:12}} start={{x:0,y:0}} end={{x:1,y:1}}><Text style={{fontSize:36}}>💰</Text></LinearGradient>
        <Text style={{fontSize:32,fontWeight:'800',color:'#f1f5f9',letterSpacing:-0.5}}>BudgetAI</Text>
        <Text style={{fontSize:16,color:'#6ee7b7',marginTop:4,fontWeight:'600'}}>{getHourGreeting()}, {state.name}!</Text>
        <Text style={{fontSize:13,color:'#64748b',marginTop:4,marginBottom:24}}>Enter your PIN to continue</Text>
        <View style={{flexDirection:'row',gap:16,marginBottom:8}}>
          {[0,1,2,3].map(i=><View key={i} style={{width:18,height:18,borderRadius:9,backgroundColor:i<pin.length?'#6ee7b7':'#232f45',borderWidth:2,borderColor:i<pin.length?'#6ee7b7':'#475569'}}/>)}
        </View>
        <Text style={{color:'#ef4444',fontSize:13,marginBottom:4,height:20}}>{error}</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'center',width:'100%',maxWidth:300,marginTop:16}}>
          {PIN_KEYS.map(k=>(
            <TouchableOpacity key={k} style={[{width:(Math.min(width,400)-120)/3,height:62,backgroundColor:'#1a2235',borderWidth:1.5,borderColor:'rgba(255,255,255,0.08)',borderRadius:16,alignItems:'center',justifyContent:'center'},attempts>=3&&{opacity:0.4}]} onPress={()=>attempts<3&&handleKey(k)} disabled={attempts>=3}>
              <Text style={{fontSize:24,fontWeight:'700',color:k==='✓'?'#6ee7b7':'#f1f5f9'}}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {state.biometricEnabled&&<TouchableOpacity style={{marginTop:32,alignItems:'center'}} onPress={tryBio}><Text style={{fontSize:28}}>👆</Text><Text style={{color:'#94a3b8',fontSize:12,marginTop:4}}>Use Fingerprint</Text></TouchableOpacity>}
      </View>
    </SafeAreaView>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const T = getDark(state.darkMode);
  const sym = state.country?.symbol || '$';
  const [currModal,setCurrModal]=useState(false);
  const [currSearch,setCurrSearch]=useState('');

  function toggle(key){ dispatch({type:'SET',key,value:!state[key]}); }
  function edit(label,key,isNum=false){
    Alert.prompt(label,`Current: ${state[key]}`,[{text:'Cancel',style:'cancel'},{text:'Save',onPress:v=>{if(v?.trim())dispatch({type:'SET',key,value:isNum?parseFloat(v)||0:v.trim();});}}],'plain-text',String(state[key]||''));
  }
  function changePin(){
    Alert.prompt('New PIN','Enter a new 4-digit PIN',[{text:'Cancel',style:'cancel'},{text:'Set',onPress:v=>{if(v&&/^\d{4}$/.test(v)){dispatch({type:'SET',key:'pin',value:v});Alert.alert('Success','PIN updated!');}else Alert.alert('Invalid','PIN must be 4 digits.');}}],'secure-text');
  }

  const filteredC=COUNTRIES.filter(c=>c.name.toLowerCase().includes(currSearch.toLowerCase())||c.currency.toLowerCase().includes(currSearch.toLowerCase()));

  const sections=[
    {title:'ACCOUNT',items:[
      {icon:'👤',bg:'rgba(110,231,183,0.1)',label:'Name',val:state.name,action:()=>edit('Your Name','name')},
      {icon:'🌍',bg:'rgba(59,130,246,0.1)',label:'Country & Currency',val:state.country?`${state.country.flag} ${state.country.currency} (${state.country.symbol})`:'—',action:()=>setCurrModal(true)},
      {icon:'💰',bg:'rgba(245,158,11,0.1)',label:'Monthly Budget',val:fmtFull(state.monthlyBudget,sym),action:()=>edit('Monthly Budget','monthlyBudget',true)},
      {icon:'📥',bg:'rgba(34,197,94,0.1)',label:'Monthly Income',val:fmtFull(state.monthlyIncome,sym),action:()=>edit('Monthly Income','monthlyIncome',true)},
    ]},
    {title:'SECURITY',items:[
      {icon:'🔒',bg:'rgba(239,68,68,0.1)',label:'PIN Lock',toggle:true,key:'pinEnabled'},
      {icon:'🔑',bg:'rgba(167,139,250,0.1)',label:'Change PIN',val:'****',action:changePin},
      {icon:'👆',bg:'rgba(59,130,246,0.1)',label:'Fingerprint / Face ID',toggle:true,key:'biometricEnabled'},
    ]},
    {title:'PREFERENCES',items:[
      {icon:'🌙',bg:'rgba(167,139,250,0.1)',label:'Dark Mode',toggle:true,key:'darkMode'},
      {icon:'🔔',bg:'rgba(234,179,8,0.1)',label:'Notifications',toggle:true,key:'notifications'},
    ]},
    {title:'DATA',items:[
      {icon:'🗑️',bg:'rgba(239,68,68,0.1)',label:'Reset App',val:'Delete all',danger:true,action:()=>{
        Alert.alert('⚠️ Reset','Delete ALL data?',[{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:()=>{
          dispatch({type:'LOAD',payload:{onboarded:false,name:'',country:null,monthlyBudget:0,monthlyIncome:0,pin:'',pinEnabled:true,biometricEnabled:false,transactions:[],goals:[],recurring:[],emergencyFund:0,emergencyTarget:0,darkMode:true,notifications:true,chatHistory:[],achievements:{}}});
        }}]);
      }},
    ]},
  ];

  return (
    <SafeAreaView style={{flex:1,backgroundColor:T.bg}} edges={['top']}>
      <View style={[s.hdr,{backgroundColor:T.surface,borderBottomColor:T.border,flexDirection:'row',alignItems:'center'}]}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={{marginRight:12}}><Ionicons name="chevron-back" size={24} color={T.text}/></TouchableOpacity>
        <Text style={[s.htitle,{color:T.text}]}>⚙️ Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}} showsVerticalScrollIndicator={false}>
        {sections.map(sec=>(
          <View key={sec.title} style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
            <Text style={{color:T.text2,fontSize:11,fontWeight:'700',letterSpacing:0.8,textTransform:'uppercase',marginBottom:12}}>{sec.title}</Text>
            {sec.items.map((item,idx)=>(
              <TouchableOpacity key={idx} style={[{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:T.border},idx===sec.items.length-1&&{borderBottomWidth:0}]}
                onPress={item.toggle?undefined:item.action} disabled={!!item.toggle}>
                <View style={{width:38,height:38,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:item.bg}}><Text style={{fontSize:18}}>{item.icon}</Text></View>
                <View style={{flex:1}}>
                  <Text style={{color:item.danger?T.red:T.text,fontSize:14,fontWeight:'600'}}>{item.label}</Text>
                  {item.val&&<Text style={{color:T.text2,fontSize:12,marginTop:1}}>{item.val}</Text>}
                </View>
                {item.toggle?<Switch value={!!state[item.key]} onValueChange={()=>toggle(item.key)} trackColor={{false:T.surface3,true:T.accent}} thumbColor="#fff"/>:<Ionicons name="chevron-forward" size={16} color={T.text3}/>}
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <Text style={{color:T.text3,fontSize:12,textAlign:'center',marginTop:8,lineHeight:18}}>BudgetAI v1.0{'\n'}Data stored securely on your device</Text>
      </ScrollView>

      <Modal visible={currModal} animationType="slide" transparent>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.6)',justifyContent:'flex-end'}}>
          <View style={[s.sheet,{backgroundColor:T.surface}]}>
            <View style={s.handle}/>
            <Text style={{fontSize:20,fontWeight:'800',color:T.text,marginBottom:14}}>Change Currency</Text>
            <TextInput style={[s.inp,{backgroundColor:T.surface2,borderColor:T.border,color:T.text,marginBottom:12}]} value={currSearch} onChangeText={setCurrSearch} placeholder="🔍 Search..." placeholderTextColor={T.text3}/>
            <FlatList data={filteredC} keyExtractor={c=>c.code} numColumns={2} columnWrapperStyle={{gap:8,marginBottom:8}} style={{maxHeight:320}} nestedScrollEnabled
              renderItem={({item:c})=>(
                <TouchableOpacity style={[s.countryItem,{backgroundColor:T.surface2,borderColor:state.country?.code===c.code?T.accent:T.border}]} onPress={()=>{dispatch({type:'SET',key:'country',value:c});setCurrModal(false);}}>
                  <Text style={{fontSize:22}}>{c.flag}</Text>
                  <Text style={{color:T.text,fontSize:11,fontWeight:'700',marginTop:3}}>{c.name}</Text>
                  <Text style={{color:T.text2,fontSize:10}}>{c.currency} {c.symbol}</Text>
                </TouchableOpacity>
              )}/>
            <TouchableOpacity style={[s.btnGhost,{borderColor:T.border,marginTop:12}]} onPress={()=>setCurrModal(false)}><Text style={{color:T.text2,fontWeight:'700',textAlign:'center'}}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  obContainer:{flexGrow:1,padding:24,alignItems:'center'},
  obLogo:{width:80,height:80,borderRadius:24,alignItems:'center',justifyContent:'center',marginTop:16},
  obTitle:{fontSize:32,fontWeight:'800',marginTop:10,letterSpacing:-0.5,color:'#f1f5f9'},
  obCard:{borderRadius:20,padding:20,width:'100%',borderWidth:1,elevation:8},
  obCardTitle:{fontSize:20,fontWeight:'800',marginBottom:4},
  pinKey:{width:(Math.min(Dimensions.get('window').width,400)-120)/3,height:56,borderRadius:14,alignItems:'center',justifyContent:'center'},
  countryItem:{flex:1,borderRadius:12,borderWidth:1.5,padding:10},
  hdr:{paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1},
  htitle:{fontSize:22,fontWeight:'800'},
  card:{borderRadius:16,padding:16,marginBottom:16,borderWidth:1},
  inp:{borderWidth:1.5,borderRadius:12,padding:13,fontSize:15,marginBottom:12},
  btnGhost:{borderWidth:1.5,borderRadius:12,padding:14},
  btnGrad:{borderRadius:12,padding:15,alignItems:'center'},
  btnTxt:{color:'#0a0f1e',fontWeight:'800',fontSize:15},
  err:{color:'#ef4444',fontSize:12,marginBottom:6},
  sheet:{borderTopLeftRadius:24,borderTopRightRadius:24,padding:24},
  handle:{width:40,height:4,backgroundColor:'rgba(255,255,255,0.15)',borderRadius:2,alignSelf:'center',marginBottom:20},
});
