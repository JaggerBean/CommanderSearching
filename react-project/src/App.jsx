import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import chef from './assets/chef.jpg'

function Header(props){ //if you need specific properties use ({name,year})
  return (
  <header>
    <h1>Goodmorning {props.name}</h1>
  </header>
  )
}

const items=["pizza","burger","sandwich"] 
const dishObjects=items.map((dish,i)=>(
  {id:i,
  title:dish}
));// this way is ideal. as we're creating the mapping before rendering

//accessing a list of items dynamically
function Main({dishes}){
  return(
    <> {/*this is called React.Fragment, used when we have to return multiple tags we can use this without adding extra nodes */}
      <div><h3>copyright 2025</h3></div>
      <main>
        <img src={chef} height={200} alt="a chef" />
        
        <ul>
          {/* {dishes.map((dish,i)=>(<li key={i}>{dish}</li>))}we are adding ,i because each list item is assigned keys to identify them better when rendering dynamically, but here the issue is mapping key is created while rendering so the stable solution is create mapping key before i,e dishobjects */}
          {dishes.map((dish)=>(
            <li key={dish.id}>{dish.title}</li>
          ))}
        </ul>
      </main>
    </>
  )
}

function App() {
  return (
    <div>    
      <Header name="People"></Header>{/* calls another component */}
      <Main dishes={dishObjects}></Main>
    </div>

  )
}

export default App

