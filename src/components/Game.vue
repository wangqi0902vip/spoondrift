<template>
  <div class="container">
  </div>
</template>
<script>
  /**
   * v1.0
   */
  let PIXI = require('pixi.js')
  let pixiSpine = require('pixi-spine')
  import resource from '../../static/game/resource.json'
  import { questoinConfig } from '../../static/config'
  import { TweenLite } from 'gsap/TweenLite'
  import { dataBox } from 'xeslive_databox'

  let SAT = new dataBox.SAT()
  let app = new PIXI.Application({
    width: 1920,
    height: 1080
  })
  let loader = new PIXI.loaders.Loader()
  export default {
    name: 'Game',
    data () {
      return {
        isGuide: true,
        start: true,
        hand: null,
        res: null,
        resultIcon: null,
        timeText: null,
        time: 120000,
        timer: null,
        tempTimer: 0,
        hero: null,
        qNum: 0,
        boxes: [],
        battles: [],
        items: [],
        questionsStatus: [],
        qNumBall: []
      }
    },
    methods: {
      preload () {
        resource.map(v => {
          loader.add(v.name, v.src)
        })
      },
      load (loader, res) {
        this.res = res
        this.createScence()
      },
      clear () {
        while (app.stage.children[0]) {
          app.stage.removeChild(app.stage.children[0])
        }
        this.boxes = []
        this.battles = []
        this.items = []
      },
      restart () {
        this.tempTimer = 0
        this.clear()
        this.complete()
      },
      submit () {
        if (this.checkWin()) {
          this.createResult('win')
        } else {
          this.createResult('wrong')
        }
      },
      nextQ () {
        this.qNum++
        if (this.qNum > questoinConfig.options.qNum - 1) {
          this.clear()
          this.createEndPage()
          return false
        }
        this.time = 120000
        this.restart()
        this.startTimer()
      },
      getRightNum () {
        let temp = 0
        this.questionsStatus.map(v => {
          if (v === 1) {
            temp++
          }
        })
        return temp
      },
      createEndPage () {
        let g = new PIXI.Graphics()
        let mask = g.drawRect(0, 0, 1920, 1080)
        mask.alpha = 0.8
        app.stage.addChild(mask)
        let jump = new PIXI.spine.Spine(this.res.jump.spineData)
        jump.x = 940
        jump.y = 300
        app.stage.addChild(jump)
        let temp = new PIXI.spine.Spine(this.res.crab.spineData)
        app.stage.addChild(temp)
        temp.x = 940
        temp.y = 270
        temp.scale.set(0.7)
        temp.state.setAnimation(0, 'congratulation', true)
        let resultBg = new PIXI.Sprite(this.res.resultBg.texture)
        Object.assign(resultBg, {
          x: 501,
          y: 299,
          width: 916,
          height: 519
        })
        app.stage.addChild(resultBg)
        let resultLabel = ['wrong', 'right']
        this.questionsStatus.map((v, i) => {
          let tempSprite = new PIXI.Sprite(this.res[resultLabel[v]].texture)
          tempSprite.x = 876 + 57 * i
          tempSprite.y = 609
          app.stage.addChild(tempSprite)
        })

        let qNum = new PIXI.Text(questoinConfig.options.qNum)
        qNum.style.fill = 0xC24A00
        qNum.style.fontSize = 60
        qNum.x = 736
        qNum.y = 507
        app.stage.addChild(qNum)

        let rightNum = new PIXI.Text(this.getRightNum())
        rightNum.style.fill = 0x79C45D
        rightNum.style.fontSize = 60
        rightNum.x = 1151
        rightNum.y = 507
        app.stage.addChild(rightNum)

        let doAgain = new PIXI.Sprite(this.res.tryagain.texture)
        doAgain.x = 765
        doAgain.y = 741
        doAgain.width = 364
        doAgain.height = 98
        doAgain.interactive = true
        doAgain.buttonMode = true
        doAgain.on('pointerdown', (e) => {
          this.qNum = 0
          this.questionsStatus = []
          this.qNumBall = []
          this.isGuide = true
          this.res['sound_loop'].data.pause()
          this.res['sound_spoondrift'].data.pause()
          this.clear()
          this.createScence()
          this.time = 120000
        })
        app.stage.addChild(doAgain)
      },
      createBattle (obj) {
        let container = new PIXI.Container()
        let fg = new PIXI.Sprite(this.res.fg.texture)
        let btl = new PIXI.Sprite(this.res[this.qNum + 1 + '_' + obj.option].texture)
        let shadow = new PIXI.Sprite(this.res.shadow.texture)
        btl.interactive = true
        btl.buttonMode = true
        btl.itemOption = obj.option
        container.itemOption = obj.option
        btl.on('pointerover', () => {
          TweenLite.to(btl.scale, 0.1, {x: 1.2, y: 1.2})
        })

        btl.on('pointerout', () => {
          TweenLite.to(btl.scale, 0.1, {x: 1, y: 1})
        })

        btl.on('pointerdown', (e) => {
          this.tempTimer = 0
          this.battlePointerDown(e, btl)
        })

        container.addChild(shadow)
        container.addChild(btl)
        container.addChild(fg)

        shadow.x = -30
        shadow.y = obj.height - 70

        btl.pivot.x = obj.width / 2
        btl.pivot.y = obj.height / 2
        btl.width = obj.width
        btl.height = obj.height
        btl.x = obj.width / 2
        btl.y = obj.height / 2

        fg.y = obj.height - 20
        fg.x = -50
        container.x = obj.x
        container.y = obj.y
        container.alpha = 0
        this.battles.push(container)
        this.items.push(btl)
        return container
      },
      battlePointerDown (e, target) {
        let pointD = Object.assign({}, e.data.global)
        let originP = Object.assign({}, target.parent.toGlobal(target.position))
        let targetP = null, tempTarget = null
        if (this.isGuide) {
          app.stage.removeChild(this.hand)
          this.hand = null
        }
        target.visible = false
        let tempTexture = target.texture.clone()
        let tempBattle = null
        tempBattle = new PIXI.Sprite(tempTexture)
        tempBattle.anchor.set(0.5, 0.5)
        tempBattle.scale.x = 0.8
        tempBattle.scale.y = 0.8
        tempBattle.alpha = 0.8
        if (target.hitIndex !== undefined) {
          target.parent.battleP[target.hitIndex].fill = false
          tempTarget = this.getBattleSprite({itemOption: target.itemOption})
          targetP = tempTarget.parent.toGlobal(tempTarget.position)
          tempBattle.itemOption = target.itemOption
          tempBattle.hitIndex = target.hitIndex
          target.parent.removeChild(target)
        } else {
          tempBattle.itemOption = target.itemOption
        }
        tempBattle.interactive = true
        tempBattle.buttonMode = true
        tempBattle.on('pointerdown', (e) => {
          this.tempTimer = 0
          this.battlePointerDown(e, tempBattle)
        })
        tempBattle.x = originP.x
        tempBattle.y = originP.y

        app.stage.addChild(tempBattle)

        let isDown = true
        app.stage.interactive = true
        let hitting = null
        app.stage.on('pointermove', (e) => {
          if (isDown === false) return false
          let pointM = Object.assign({}, e.data.global)
          tempBattle.x = originP.x + pointM.x - pointD.x
          tempBattle.y = originP.y + pointM.y - pointD.y
          hitting = this.hitTest(tempBattle)
        })
        app.stage.on('pointerup', (e) => {
          if (isDown === false) return
          tempBattle.alpha = 1
          isDown = false
          if (hitting === null) {
            if (target.hitIndex !== undefined) {
              TweenLite.fromTo(tempBattle, 0.3, {
                x: tempBattle.x,
                y: tempBattle.y
              }, {
                x: targetP.x, y: targetP.y, onComplete: () => {
                  app.stage.removeChild(tempBattle)
                  tempTarget.visible = true
                }
              })
            } else {
              TweenLite.fromTo(tempBattle, 0.3, {
                x: e.data.global.x,
                y: e.data.global.y
              }, {
                x: originP.x, y: originP.y, onComplete: () => {
                  app.stage.removeChild(tempBattle)
                  target.visible = true
                }
              })
            }
          } else {
            let i = 0
            while (hitting.battleP[i] !== undefined && hitting.battleP[i].fill) {
              i++
            }
            let endPosition = hitting.battleP[i]
            if (endPosition === undefined) {
              if (tempBattle.hitIndex !== undefined) {
                TweenLite.fromTo(tempBattle, 0.3, {
                  x: tempBattle.x,
                  y: tempBattle.y
                }, {
                  x: targetP.x, y: targetP.y, onComplete: () => {
                    app.stage.removeChild(tempBattle)
                    tempTarget.visible = true
                  }
                })
              } else {
                tempBattle.x = e.data.global.x
                tempBattle.y = e.data.global.y
                app.stage.addChild(tempBattle)
                TweenLite.to(tempBattle, 1, {
                  x: originP.x, y: originP.y, onComplete: () => {
                    app.stage.removeChild(tempBattle)
                    target.visible = true
                    tempBattle = null
                  }
                })
              }
            } else {
              target.visible = false
              let index = this.items.indexOf(target)
              if (index !== -1) {
                this.items.splice(index, 1)
              }
              this.playSound('sound_drop', false)
              let upP = hitting.toLocal(tempBattle.position)
              hitting.addChild(tempBattle)
              TweenLite.from(tempBattle, 1, {x: upP.x, y: upP.y})
              hitting.battleP[i].fill = true
              tempBattle.hitIndex = i
              TweenLite.to(tempBattle, 1, {
                x: endPosition.x, y: endPosition.y, onComplete: () => {
                  target = null
                }
              })
              if (this.isGuide) {
                while (app.stage.children[0]) {
                  app.stage.removeChild(app.stage.children[0])
                }
                this.boxes = []
                this.hero = null
                this.isGuide = false
                this.playSound('sound_loop', true)
                this.complete()
                this.startTimer()
              }
            }
          }
          app.stage.off('pointermove', null)
          app.stage.off('pointerup', null)
        })
      },
      getBattleSprite (obj) {
        let container = this.getSprite(obj)
        let temp = null
        container.children.map(v => {
          if (v.itemOption !== undefined) {
            temp = v
          }
        })
        return temp
      },
      getSprite (obj) {
        let temp = null
        Object.keys(obj).map(v => {
          temp = app.stage.children.find(a => a[v] !== undefined && a[v] === obj[v])
        })
        return temp
      },
      go () {
        this.items.map(v => {
          let times = 0
          let animation = TweenLite.to(v.scale, 0.5, {
            x: 1.2, y: 1.2, onComplete: () => {
              TweenLite.to(v.scale, 0.5, {
                x: 1, y: 1, onComplete: () => {
                  times++
                  if (times <= 2) {
                    animation.restart()
                  } else {
                    this.tempTimer = 0
                  }
                }
              })
            }
          })
        })
      },
      playSound (name, loop, volume = 1) {
        this.res[name].data.loop = loop
        this.res[name].data.volume = volume
        this.res[name].data.play()
      },
      checkBox () {
        for (let i = 0; i < this.boxes.length; i++) {
          let tempI = this.boxes[i]
          for (let j = 0; j < tempI.children.length; j++) {
            let tempJ = tempI.children[j]
            if (tempJ.itemOption % tempI.itemOption !== 0) {
              return false
            }
          }
        }
        return true
      },
      checkStage () {
        let rest = this.items
        for (let i = 0; i < this.boxes.length; i++) {
          let tempI = this.boxes[i]
          for (let j = 0; j < rest.length; j++) {
            let tempJ = rest[j]
            if (tempJ.itemOption % tempI.itemOption === 0) {
              return false
            }
          }
        }
        return true
      },
      checkWin () {
        if (this.checkBox()) {
          return this.checkStage()
        }
        return false
      },
      startTimer () {
        if (this.timer !== null) {
          clearInterval(this.timer)
        }
        this.timer = setInterval(() => {
          this.tempTimer++
          this.time -= 1000
          if (this.time === 0) {
            clearInterval(this.timer)
            this.timer = null
            this.createResult('timeout')
          } else if (this.time <= 30000) {
            if (this.time === 30000) this.playSound('sound_hurryup', false)
            this.timeText.style.fill = '0xff0000'
          }
          if (this.tempTimer === 10) {
            this.go()
          }
          let date = new Date(this.time)
          this.timeText.text = '0' + date.getMinutes() + ':' + (date.getSeconds() >= 10 ? date.getSeconds() : '0' + date.getSeconds())
        }, 1000)
      },
      createTimer () {
        let timerSprite = new PIXI.Sprite(this.res.timeBg.texture)
        timerSprite.alpha = 0
        Object.assign(timerSprite, questoinConfig.options.timeBg)
        let timeText = this.timeText = new PIXI.Text()
        timerSprite.addChild(timeText)
        timeText.style.fontSize = 36
        timeText.style.fill = '0x81440d'
        timeText.x = 90
        timeText.y = 10
        app.stage.addChild(timerSprite)
        TweenLite.to(timerSprite, 2, {alpha: 1})
      },
      createResult (obj) {
        let result = obj
        if (this.timer !== null) {
          clearInterval(this.timer)
          this.timer = null
        }
        this.playSound('sound_' + obj, false)
        obj = questoinConfig.result[obj]
        let container = new PIXI.Sprite()
        container.x = 0
        container.y = 0
        container.width = 1920
        container.height = 1080
        let g = new PIXI.Graphics()
        let mask = g.drawRect(0, 0, 1920, 1080)
        mask.alpha = 0.8
        mask.interactive = true
        container.interactive = true
        container.addChild(mask)
        app.stage.addChild(container)
        let jump = new PIXI.spine.Spine(this.res.jump.spineData)
        app.stage.addChild(jump)
        let temp = new PIXI.spine.Spine(this.res.crab.spineData)
        app.stage.addChild(temp)
        let slot = jump.skeleton.findSlotIndex('text')
        let txtAttach = jump.skeleton.getAttachment(slot, obj.text)
        jump.skeleton.slots[slot].setAttachment(txtAttach)
        temp.x = 940
        temp.y = 425
        temp.scale.set(0.8)
        jump.x = 940
        jump.y = 500
        jump.state.setAnimation(0, 'animate', false)
        temp.state.setAnimation(0, obj.hero, false)
        jump.state.tracks[0].listener = {
          complete: () => {
            setTimeout(() => {
              destroy()
              if (result === 'win') {
                result = 'right'
                this.questionsStatus.push(1)
              } else {
                result = 'wrong'
                this.questionsStatus.push(0)
              }
              this.addResultSprite(result)
              this.resultIcon.x = this.qNumBall[this.qNum].x - 10
              this.nextQ()
            })
          }
        }

        function destroy () {
          app.stage.removeChild(temp)
          app.stage.removeChild(jump)
          app.stage.removeChild(mask)
        }
      },
      addResultSprite (result) {
        let resultSprite = new PIXI.Sprite(this.res[result].texture)
        this.qNumBall[this.qNum].addChild(resultSprite)
      },
      hitTest (target) {
        let tHit = new SAT.rectangle(target.getBounds())
        let isHitting = null
        this.boxes.map(v => {
          let temp = new SAT.rectangle(v.getBounds())
          if (SAT.sat(temp, tHit)) isHitting = v
        })
        return isHitting
      },
      createBox (obj) {
        let box = new PIXI.Sprite(this.res[obj.option].texture)
        box.x = obj.x
        box.y = obj.y
        box.width = obj.width
        box.height = obj.height
        obj.battleP.map(v => {
          v.fill = false
        })
        box.battleP = obj.battleP
        box.itemOption = obj.itemOption
        box.interactive = true
        box.alpha = 0
        this.boxes.push(box)
        return box
      },
      createHero (obj) {
        let hero = new PIXI.spine.Spine(this.res.crab.spineData)
        hero.x = obj.x
        hero.y = obj.y
        hero.width = obj.width
        hero.height = obj.height
        this.hero = window.hero = hero
        hero.interactive = true
        hero.buttonMode = true
        hero.state.setAnimation(0, 'stay', true)
        hero.on('pointerdown', (e) => {
          this.heroClick(e)
        })
        return hero
      },
      createGuideHero (obj) {
        let hero = new PIXI.spine.Spine(this.res.crab.spineData)
        Object.assign(hero, obj)
        hero.state.setAnimation(0, 'stay', true)
        hero.buttonMode = true
        hero.interactive = true
        hero.on('pointerdown', () => {
          this.playSound('sound_guide', false)
        })
        let guidePop = new PIXI.Sprite(this.res.guideStem.texture)
        guidePop.x = 400
        guidePop.y = 647
        guidePop.width = 352
        guidePop.height = 337
        guidePop.scale.set(0.1)
        app.stage.addChild(hero)
        app.stage.addChild(guidePop)
        TweenLite.to(guidePop, 1, {x: 430, y: 147})
        TweenLite.to(guidePop.scale, 1, {x: 1, y: 1})
      },
      createBtn () {
        let submitContainer = new PIXI.Sprite(this.res.btnBg.texture)
        Object.assign(submitContainer, questoinConfig.buttons.find(v => v.label === 'submitBg'))
        app.stage.addChild(submitContainer)
        let submit = new PIXI.Sprite(this.res.submit.texture)
        Object.assign(submit, questoinConfig.buttons.find(v => v.label === 'submit'))
        app.stage.addChild(submit)
        submit.interactive = true
        submit.buttonMode = true
        submit.anchor.set(0.5, 0.5)
        submit.x += submit.width / 2
        submit.y += submit.height / 2
        submit.on('pointerover', (e) => {
          TweenLite.to(submit.scale, 0.3, {x: 1.1, y: 1.1})
        })
        submit.on('pointerout', (e) => {
          TweenLite.to(submit.scale, 0.3, {x: 1, y: 1})
        })
        submit.on('pointerdown', (e) => {
          this.submit()
        })

        let restartContainer = new PIXI.Sprite(this.res.btnBg.texture)
        Object.assign(restartContainer, questoinConfig.buttons.find(v => v.label === 'restartBg'))
        app.stage.addChild(restartContainer)
        let restart = new PIXI.Sprite(this.res.restart.texture)
        Object.assign(restart, questoinConfig.buttons.find(v => v.label === 'restart'))
        app.stage.addChild(restart)
        restart.interactive = true
        restart.buttonMode = true
        restart.anchor.set(0.5, 0.5)
        restart.x += restart.width / 2
        restart.y += restart.height / 2
        restart.on('pointerover', (e) => {
          TweenLite.to(restart.scale, 0.3, {x: 1.1, y: 1.1})
        })
        restart.on('pointerout', (e) => {
          TweenLite.to(restart.scale, 0.3, {x: 1, y: 1})
        })
        restart.on('pointerdown', (e) => {
          this.restart()
        })
      },
      heroClick () {
        this.createPop()
        this.playSound('sound_stem', false)
      },
      createPop () {
        let isBreak = false
        this.playSound('sound_makepop', false)
        let pop = new PIXI.Sprite(this.res.stem.texture)
        pop.x = this.hero.position.x
        pop.y = this.hero.position.y
        pop.scale.set(0.1)
        pop.interactive = true
        pop.buttonMode = true
        pop.on('pointerdown', () => {
          pop.texture = this.res.popbreak.texture
          setTimeout(() => {
            app.stage.removeChild(pop)
            pop = null
            this.playSound('sound_popBreak', false)
            isBreak = true
          }, 100)
        })

        TweenLite.to(pop, 1, {x: pop.x + this.hero.width / 2, y: pop.y - this.hero.height})
        TweenLite.to(pop.scale, 1, {
          x: 1, y: 1, onComplete: () => {
            TweenLite.to(pop, 5, {
              y: 0, onComplete: (e) => {
                if (isBreak) return
                pop.texture = this.res.popbreak.texture
                setTimeout(() => {
                  app.stage.removeChild(pop)
                  pop = null
                  this.playSound('sound_popBreak', false)
                  isBreak = true
                }, 100)
              }
            })
          }
        })
        app.stage.addChild(pop)
      },
      createQnumBall () {
        if (this.qNumBall.length > 0) {
          this.qNumBall.map(v => {
            app.stage.addChild(v)
          })
        } else {
          for (let i = 0; i < questoinConfig.options.qNum; i++) {
            let temp = new PIXI.Sprite(this.res.numBall.texture)
            temp.x = questoinConfig.options.qNumX + i * questoinConfig.options.qNumMargin
            temp.y = questoinConfig.options.qNumY
            temp.width = questoinConfig.options.qNumR
            temp.height = questoinConfig.options.qNumR
            app.stage.addChild(temp)
            this.qNumBall.push(temp)
          }
        }
        this.resultIcon = new PIXI.Sprite(this.res.current.texture)
        this.resultIcon.x = this.qNumBall[this.qNum].x - 10
        this.resultIcon.y = this.qNumBall[this.qNum].y
        app.stage.addChild(this.resultIcon)

      },
      createScence () {
        let bg = new PIXI.Sprite(this.res.bg.texture)
        Object.assign(bg, questoinConfig.background)
        app.stage.addChild(bg)
        if (this.isGuide) {this.guide()}

      },
      guide () {
        let battle = this.createBattle(questoinConfig.questions[0].battles[4])
        battle.alpha = 1
        battle.x = 880
        app.stage.addChild(battle)
        let beach = new PIXI.spine.Spine(this.res.beach.spineData)
        beach.state.setAnimation(0, 'normal', true)
        beach.x = 960
        beach.y = 500
        app.stage.addChild(beach)
        let box = this.createBox(questoinConfig.questions[0].boxes[1])
        app.stage.addChild(box)
        box.alpha = 1
        let hand = this.hand = new PIXI.Sprite(this.res.hand.texture)
        app.stage.addChild(hand)
        this.createGuideHero({x: 456, y: 630, width: 300, height: 300})
        let animate = TweenLite.fromTo(hand, 1, {x: battle.x + 50, y: battle.y + 50}, {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
            delay: 0.5,
            onComplete: () => {
              animate.restart(true, false)
            }
          }
        )
      },
      complete () {
        this.createScence()
        let frontBeach = new PIXI.Sprite(this.res.frontBeach.texture)
        let beach = new PIXI.spine.Spine(this.res.beach.spineData)
        beach.state.setAnimation(0, 'turn', false)
        this.playSound('sound_spoondriftOn', false, 0.5)
        let isComplete = false
        beach.state.addListener({
          complete: () => {
            if (isComplete) return
            beach.state.setAnimation(0, 'normal', true)
            this.playSound('sound_spoondrift', true, 0.5)
            this.boxes.map((v, i) => {
              TweenLite.fromTo(v, 1, {alpha: 0, y: 1200}, {alpha: 1, y: questoinConfig.questions[this.qNum].boxes[i].y})
            })
            this.battles.map(v => {
              TweenLite.to(v, 1, {alpha: 1})
            })
            isComplete = true

          }
        })

        beach.x = 960
        beach.y = 500
        frontBeach.width = 1920
        frontBeach.height = 120
        frontBeach.y = 960
        frontBeach.x = 0
        app.stage.addChild(beach)

        questoinConfig.questions[this.qNum].battles.map(v => {
          app.stage.addChild(this.createBattle(v))
        })
        questoinConfig.questions[this.qNum].boxes.map(v => {
          app.stage.addChild(this.createBox(v))
        })
        app.stage.addChild(frontBeach)

        app.stage.addChild(this.createHero(questoinConfig.hero))
        TweenLite.fromTo(this.hero, 1, {x: app.stage.width / 2, y: 100}, {
          y: 900, onComplete: () => {
            TweenLite.to(this.hero, 1, {
              x: questoinConfig.hero.x, y: questoinConfig.hero.y, onComplete: () => {
                this.heroClick()
              }
            })
          }
        })

        this.createQnumBall()
        this.createBtn()
        this.createTimer()
      },
    },
    mounted () {
      app.view.style.width = '19.2rem'
      app.view.style.height = '10.8rem'
      PIXI.utils.destroyTextureCache()
      this.$el.appendChild(app.view)
      this.preload()
      loader.load(this.load)
    }
  }
</script>
