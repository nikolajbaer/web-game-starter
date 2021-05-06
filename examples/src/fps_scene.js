import { CameraComponent,  ModelComponent, LightComponent  } from "../../src/core/components/render"
import { BodyComponent } from "../../src/core/components/physics"
import { LocRotComponent } from "../../src/core/components/position"
import { Vector3 } from "../../src/core/ecs_types"
import { ActionListenerComponent } from "../../src/core/components/controls"
import { MoverComponent } from "../../src/common/components/movement"
import { TagComponent } from "ecsy"
import { CameraFollowComponent } from "../../src/common/components/camera_follow"
import { AnimatedComponent, PlayActionComponent } from "../../src/core/components/animated"
import { AnimatedMovementComponent } from "../../src/common/components/animated_movement"
import { Physics3dScene } from "../../src/scene/scene"
import { MovementSystem } from "../../src/common/systems/movement"
import { AnimatedSystem } from "../../src/core/systems/animated"
import { AnimatedMovementSystem } from "../../src/common/systems/animated_movement"
import { SoundEffectComponent } from "../../src/core/components/sound"

// asset urls
import mechaGLB from "./assets/mecha.glb"
import bleepMP3 from "./assets/bleep.mp3"
import { MouseLookComponent } from "../../src/common/components/mouselook"
import { MouseLookSystem } from "../../src/common/systems/mouselook"
import * as CANNON from "cannon-es"

class HitComponent extends TagComponent {}

export class FPSScene extends Physics3dScene {
    register_components(){
        super.register_components()
        this.world.registerComponent(MoverComponent)
        this.world.registerComponent(HitComponent)
        this.world.registerComponent(AnimatedComponent)
        this.world.registerComponent(AnimatedMovementComponent)
        this.world.registerComponent(PlayActionComponent)
        this.world.registerComponent(MouseLookComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(MovementSystem)
        this.world.registerSystem(AnimatedSystem)
        this.world.registerSystem(AnimatedMovementSystem)
        this.world.registerSystem(MouseLookSystem,{listen_element_id:this.render_element_id})
    }

    handle_collision(entity_a,entity_b,contact){
        if(entity_b.hasComponent(HitComponent) && entity_a.hasComponent(HitComponent)){
            entity_b.addComponent(SoundEffectComponent,{sound:"bleep"})
        }

        let mover = null
        let contactNormal = new CANNON.Vec3()
        if(entity_a.hasComponent(MoverComponent)){
            mover = entity_a
            contact.ni.negate(contactNormal)
        }else if(entity_b.hasComponent(MoverComponent)){
            mover = entity_b
            contactNormal.copy(contact.ni)
        }

        if(mover){
            if (contactNormal.dot(new CANNON.Vec3(0,1,0)) > 0.5) {
                const m = mover.getMutableComponent(MoverComponent)
                m.can_jump = true
            }
        }

    }

    init_entities(){

        // create a ground plane
        const g = this.world.createEntity()
        g.addComponent( BodyComponent, {
            mass: 0,
            bounds_type: BodyComponent.PLANE_TYPE,
            body_type: BodyComponent.STATIC,
        })
        g.addComponent( ModelComponent, {geometry:"ground",material:"ground"})
        g.addComponent( LocRotComponent, { rotation: new Vector3(-Math.PI/2,0,0) } )


        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient"})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(10,30,0)})
        l2.addComponent(LightComponent,{type:"point",cast_shadow:true,intensity:0.8})

        // Add our FPS camera
        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,1),current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(0,2.5,0)})

        // add a player
        const e = this.world.createEntity()
        e.addComponent(ModelComponent,{geometry:"none",scale: new Vector3(1,1,1)})
        e.addComponent(LocRotComponent,{location: new Vector3(0,0.5,0)})
        e.addComponent(ActionListenerComponent)
        e.addComponent(BodyComponent,{
            body_type: BodyComponent.DYNAMIC,
            bounds_type:BodyComponent.SPHERE_TYPE,
            track_collisions:true,
            //fixed_rotation: true,
            bounds: new Vector3(1,1,1),
            material: "player",
            mass: 100,
        })
        e.addComponent(HitComponent)
        e.addComponent(MoverComponent,{
            speed:10.0,
            kinematic:true,
            turner:false,
            local:true,
            jump_speed: 10,
        })
        e.addComponent(MouseLookComponent,{offset:new Vector3(0,2,0),invert_y:true})
        //e.addComponent(CameraFollowComponent,{offset:new Vector3(0,10,-10)})

        // add something to bump into
        const e1 = this.world.createEntity()
        e1.addComponent(ModelComponent,{geometry:"sphere"})
        e1.addComponent(LocRotComponent,{location: new Vector3(10,1,10)})
        e1.addComponent(BodyComponent,{mass:100,bounds_type:BodyComponent.SPHERE_TYPE})

        // and some walls
        for(var i=0; i<4;i++){
            const w = this.world.createEntity()
            w.addComponent(ModelComponent,{geometry:"box",material:"ground",scale:new Vector3(50,10,5)})
            w.addComponent(BodyComponent,{
                bounds_type:BodyComponent.BOX_TYPE,
                body_type:BodyComponent.STATIC,
                bounds: new Vector3(50,10,5),
                mass: 0,
            })
            w.addComponent(LocRotComponent,{
                location: [
                    new Vector3(0,0,25),
                    new Vector3(25,0,0),
                    new Vector3(0,0,-25),
                    new Vector3(-25,0,0),
                ][i],
                rotation:new Vector3(0,i*Math.PI/2,0)
            })
        }
    }

    get_meshes_to_load(){
        return {
            "mecha":{ url:mechaGLB },
        }
    }

    get_sounds_to_load(){
        return {
            "bleep": {url: bleepMP3 },
        }
    }
}
