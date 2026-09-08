export type Burger = { id:string; name:string; category:'Beef'|'Chicken'|'Veggie'; price:number; image:string; label:string; description:string; ingredients:string; allergens:string; color:string };
// Editable concept menu. Prices are samples; checkout is not connected.
export const currency = 'USD';
export const burgers: Burger[] = [
 {id:'ember-double',name:'The Ember Double',category:'Beef',price:12.5,image:'/smash-burger.png',label:'THE ORIGINAL OBSESSION',description:'Two crispy-edged beef patties. Double cheese. The burger that started it all.',ingredients:'Double smashed beef, American cheese, pickles, onion, Ember sauce, sesame brioche.',allergens:'Wheat, milk, egg, sesame, mustard.',color:'orange'},
 {id:'hot-honey',name:'Hot Honey Crunch',category:'Chicken',price:11.5,image:'/hot-honey.png',label:'SWEET HEAT. LOUD CRUNCH.',description:'Golden fried chicken, a hot honey kick and slaw that cuts right through.',ingredients:'Crispy chicken, spicy honey glaze, slaw, pickles, sesame brioche.',allergens:'Wheat, milk, egg, sesame.',color:'lime'},
 {id:'shroom-service',name:'Shroom Service',category:'Veggie',price:10.5,image:'/shroom-service.png',label:'NO BEEF. BIG PERSONALITY.',description:'A seared portobello, nutty Swiss and sweet onions. No beef required.',ingredients:'Portobello mushroom, Swiss cheese, caramelised onion, rocket, garlic mayo, sesame brioche.',allergens:'Wheat, milk, egg, sesame. Vegetarian; not vegan.',color:'peach'}
];
export const money=(amount:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:2}).format(amount);
