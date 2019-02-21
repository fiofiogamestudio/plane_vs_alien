// add canvas
const WIDTH_CANVAS=480;
const HEIGHT_CANVAS=640;
var canvas=document.createElement("canvas");
canvas.width=WIDTH_CANVAS;
canvas.height=HEIGHT_CANVAS;
canvas.style.border="1px dashed black";
canvas.style.backgroundColor="white";
document.body.appendChild(canvas);
var ctx=canvas.getContext("2d");
// game loop
const FPS=30;
setInterval(function(){
    update();
    render();
},1000/FPS);
let arr_obj=[];
let arr_collider=[];
function add_obj(arr,o){
    arr.push(o);
}
function update(){
    arr_obj.forEach(function(o){
        if(o.active)o.update();
    });
    // handle collision
    let len=arr_collider.length;
    for(let i=0;i<len-1;i++){
        for(let j=i+1;j<len;j++){
            // console.log(i+" "+j)
            if(arr_collider[i].active&&arr_collider[j].active){
                if(is_collision(arr_collider[i],arr_collider[j])){
                    arr_collider[i].collision(arr_collider[j]);
                    arr_collider[j].collision(arr_collider[i]);
                }
            }
        }
    }
}
function render(){
    ctx.clearRect(0,0,WIDTH_CANVAS,HEIGHT_CANVAS);
    arr_obj.forEach(function(o){
        if(o.active)o.render();
    });
}
// handle collision
function is_collision(a,b){
    let less=function(c,d){
        return (c.pos_x-c.reg_x*c.width<d.pos_x-d.reg_x*d.width+d.width)&&(c.pos_y-c.reg_y*c.height<d.pos_y-d.reg_y*d.height+d.height);
    }
    return less(a,b)&&less(b,a);
}
// render text
function write(txt,x,y){
    let w=ctx.measureText(txt).width;
    let h=ctx.measureText("M").width;
    ctx.fillText(txt,x-w/2,y-h/2);
}
// save data
let data={
    save:function(name,data){
        localStorage.setItem(name,data);
    },
    load:function(name,def){
        if(localStorage.getItem(name)===null)return def;
        else return localStorage.getItem(name);
    }
}
// detect keypress
let map_is_keypress={};
function is_keypress(key){
    return map_is_keypress[key]||false;
}
window.addEventListener("keydown",call_keydown,false);
function  call_keydown(event){
    map_is_keypress[event.code]=true; 
}
window.addEventListener("keyup",call_keyup,false);
function call_keyup(event){
    map_is_keypress[event.code]=false;
}
// entity
function Entity(){
    let o={};
    o.name="entity"
    o.active=true;
    o.width=0;
    o.height=0;
    o.reg_x=0.5;
    o.reg_y=0.5;
    o.color="black";
    o.alpha=1;
    o.pos_x=0;
    o.pos_y=0;
    o.vel_x=0;
    o.vel_y=0;
    o.update=function(){
        o.pos_x+=o.vel_x;
        o.pos_y+=o.vel_y;
    };
    o.render=function(){
        ctx.save();
        ctx.globalAlpha=o.alpha;
        ctx.fillStyle=o.color;
        ctx.fillRect(o.pos_x-o.reg_x*o.width,o.pos_y-o.reg_y*o.width,o.width,o.height);
        ctx.restore();
    };
    o.collision=function(p){}
    return o;
}
// sprite
function Sprite(){
    let o=Entity();
    o.name="sprite";
    o.image=null;
    o.render=function(){
        ctx.save();
        ctx.globalAlpha=o.alpha;
        ctx.drawImage(o.image,o.pos_x-o.reg_x*o.width,o.pos_y-o.reg_y*o.width)
        ctx.restore();
    }
    o.load=function(src){
        o.image=new Image(o.width,o.height);
        o.image.src=src;
    }
    return o;
}
// animation
function Animation(){
    let o=Entity();
    o.name="animation";
    o.path=null;
    o.frame_total=0;
    o.frame_cur=0;
    o.interval_frame=3;
    o.interval_cur=0;
    o.render=function(){
        o.interval_cur++;
        if(o.interval_cur>=o.interval_frame){
            o.interval_cur=0;
            o.frame_cur++;
            if(o.frame_cur>=o.frame_total){
                o.active=false;
                return;
            }
        }
        let frame=new Image(o.width,o.height);
        frame.src=o.path+o.frame_cur+".png";
        ctx.save();
        ctx.globalAlpha=o.alpha;
        ctx.drawImage(frame,o.pos_x-o.reg_x*o.width,o.pos_y-o.reg_y*o.width);
        ctx.restore();
    }
    o.load=function(path,len){
        o.path=path;
        o.frame_total=len;
    }
    return o;
}
// player
function Player(){
    let o=Sprite();
    o.name="player";
    o.width=32;
    o.height=32;
    o.pos_x=WIDTH_CANVAS/2-o.width/2;
    o.pos_y=HEIGHT_CANVAS*3/4-o.height/2;
    o.vel_x=3;
    o.vel_y=3;
    // custom
    o.rest_fire=30;
    o.hp_total=5;
    o.hp=5;
    o.update=function(){
        // move
        if(is_keypress("KeyA")){
            o.pos_x-=o.vel_x;
        }else if(is_keypress("KeyD")){
            o.pos_x+=o.vel_x;
        }
        if(is_keypress("KeyW")){
            o.pos_y-=o.vel_y;
        }else if(is_keypress("KeyS")){
            o.pos_y+=o.vel_y;
        }
        // clamp
        o.pos_x=o.pos_x<0?0:o.pos_x;
        o.pos_x=o.pos_x>WIDTH_CANVAS?WIDTH_CANVAS:o.pos_x;
        o.pos_y=o.pos_y<0?0:o.pos_y;
        o.pos_y=o.pos_y>HEIGHT_CANVAS?HEIGHT_CANVAS:o.pos_y;
        // fire
        o.rest_fire++;
        if(o.rest_fire>10&&is_keypress("Space")){
            o.rest_fire=0;
            let bullet=Bullet();
            bullet.pos_x=o.pos_x-Math.floor(Math.random()*3);
            bullet.pos_y=o.pos_y;
            add_obj(arr_obj,bullet);
            add_obj(arr_collider,bullet);
        }
    }
    o.collision=function(p){
        if(p.name==="enemy"){
            o.hp-=1;
            o.alpha=o.hp/o.hp_total;
            if(o.hp<=0){
                o.active=false;
                is_lose=true;
            }
        }
    }
    o.load("assets/player.png",o.width,o.height);
    return o;
}
// bullet
function Bullet(){
    let o=Sprite();
    o.name="bullet";
    o.width=4;
    o.height=4;
    o.vel_y=-5;
    o.collision=function(p){
        if(p.name==="enemy"){
            o.active=false;
        }
    }
    o.load("assets/bullet.png",o.width,o.height);
    return o;
}
// enemy
function Enemy(){
    let o=Sprite();
    o.name="enemy";
    o.width=32;
    o.height=24;
    o.vel_y=2;
    o.range=Math.floor(Math.random()*4+1);
    o.age=Math.floor(Math.random()*120);
    o.hp_total=2;
    o.hp=2;
    o.update=function(){
        o.age++;
        o.pos_x+=o.vel_x;
        o.pos_y+=o.vel_y;
        o.vel_x=o.range*Math.sin(o.age/60*Math.PI);
    }
    o.collision=function(p){
        if(p.name==="player"){
            o.active=false;
        }else if(p.name==="bullet"){
            o.hp--;
            o.alpha=o.hp/o.hp_total;
            if(o.hp<=0){
                o.active=false;
                num_destroy++;
                if(num_destroy>data.load("record",0))data.save("record",num_destroy);
                let explosion=Explosion();
                explosion.pos_x=o.pos_x;
                explosion.pos_y=o.pos_y;
                add_obj(arr_obj,explosion);
            }
        }
    }
    o.load("assets/enemy.png",o.width,o.height)
    return o;
}
// explosion
function Explosion(){
    let o=Animation();
    o.name="explosion";
    o.width=32;
    o.height=32;
    o.load("assets/explosion",4);
    return o;
}
function Game(){
    let o=Entity();
    o.name="game";
    o.is_run=false;
    o.start=function(){};
    o.quit=function(){
        arr_obj=new Array();
        arr_collider=new Array();
        add_obj(arr_obj,o);
    };
    o.restart=function(){
        o.quit();
        o.start();
    }
    o.update=function(){
        if(!o.is_run&&is_keypress("KeyF")){
            o.is_run=true;
            o.start();
        }else if(o.is_run&&is_keypress("KeyQ")){
            o.is_run=false;
            o.quit(game);
        }else if(o.is_run&&is_keypress("KeyR")){
            o.restart();
        }
    }
    o.render=function(){
        if(o.is_run)return;
        ctx.save();
        ctx.font="15px Arial";
        write("press F to start",WIDTH_CANVAS/2,HEIGHT_CANVAS/4);
        write("press Q to quit",WIDTH_CANVAS/2,HEIGHT_CANVAS/4+50);
        write("press R to restart",WIDTH_CANVAS/2,HEIGHT_CANVAS/4+100);
        write("press W/A/S/D to move",WIDTH_CANVAS/2,HEIGHT_CANVAS/4+200);
        write("press Space to fire",WIDTH_CANVAS/2,HEIGHT_CANVAS/4+250);
        write("record: "+data.load("record",0),WIDTH_CANVAS/2,HEIGHT_CANVAS/4+300);
    }
    return o;
}
// init game
let game=Game();
add_obj(arr_obj,game);
// global data
let is_lose;
let frame;
let num_destroy;
// start game
game.start=function(){
    is_lose=false;
    frame=0;
    num_destroy=0;
    let player=Player();
    add_obj(arr_obj,player);
    add_obj(arr_collider,player);
    // spawner
    let spawner=Entity();
    let rest_spawn=0;
    let interval_spawn=6000;
    spawner.update=function(){
        rest_spawn++;
        interval_spawn-=2;
        if(!is_lose&&rest_spawn>interval_spawn/100){
            rest_spawn=0;
            let enemy=Enemy();
            enemy.pos_x=WIDTH_CANVAS/4+WIDTH_CANVAS/2*Math.random();
            add_obj(arr_obj,enemy);
            add_obj(arr_collider,enemy);
        }
    }
    add_obj(arr_obj,spawner);
    // ui
    let ui=Entity();
    ui.update=function(){
        if(!is_lose)frame++;
    }
    ui.render=function(){
        // show hp
        ctx.font="15px Arial";
        write("HP: "+player.hp,40,40);
        // show destroy
        write("DT: "+num_destroy,WIDTH_CANVAS-40,40)
        // show time
        write("time: "+(frame/30).toFixed(2),WIDTH_CANVAS/2,40);
        if(is_lose){
            write("press Q to quit",WIDTH_CANVAS/2,HEIGHT_CANVAS/4+50);
            write("press R to restart",WIDTH_CANVAS/2,HEIGHT_CANVAS/4+100);
            write("you survive for: "+(frame/30).toFixed(2),WIDTH_CANVAS/2,HEIGHT_CANVAS/4+200);
            write("your score is: "+num_destroy,WIDTH_CANVAS/2,HEIGHT_CANVAS/4+250);
            write("your record is: "+data.load("record",0),WIDTH_CANVAS/2,HEIGHT_CANVAS/4+300);
        }
    }
    add_obj(arr_obj,ui);
}