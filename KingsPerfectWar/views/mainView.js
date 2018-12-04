let view = {
    initialize: function() {
        view.clickable.initial.createCastleIcons();
        view.clickable.initial.createWarMap();
        view.clickable.initial.createKingIcons();
        this.actionInfoDiv = {"king":document.getElementById("actionInfoDivKing"),
            "castle":document.getElementById("actionInfoDivCastle"),
            "units":document.getElementById("actionInfoDivUnits"),
            "lab":document.getElementById("actionInfoDivLab")};
    },
    updating: {
        update: function () {
            //compare prevState to current
            //update the view of anything that's changed
            //order of these is important
            view.updating.updateLists();
            view.updating.updateResources();
            view.updating.updateCreated();
            view.updating.updateUnits();
            view.updating.updateTraveling();
            view.updating.updateKingTab();

            view.updating.saveCurrentState();
        },
        saveCurrentState: function () {
            prevState.mana = mana;
            prevState.maxMana = maxMana;
            prevState.gold = gold;
            prevState.wood = wood;
            prevState.next = copyArray(actionsList.next);
            prevState.current = copyArray(actionsList.current);
            prevState.created = copyArray(created);
            prevState.levelData = copyArray(levelData);
            prevState.king = {};
            prevState.king.savedData = copyArray(king.savedData);
            prevState.king.curData = copyArray(king.curData);
            prevState.levelSave = copyArray(levelSave[curLevel]);
        },
        updateResources: function() {
            if(prevState.mana !== mana || prevState.maxMana !== maxMana) {
                document.getElementById("manaBar").style.width = mana / maxMana * 100 + "%";
                document.getElementById("mana").innerHTML = intToString(mana, 1);
                document.getElementById("manaTooltip").innerHTML = "Mana.<br>Start with " + intToString(levelData.initial.mana, 1) + "<br>Current max is " + intToString(maxMana, 1);
            }
            if(prevState.gold !== gold) {
                let goldToAdd = castle.helpers.goldToAdd();
                document.getElementById("gold").innerHTML = intToString(gold, 1);
                document.getElementById("goldPerTick").innerHTML = intToString(goldToAdd, 1);
                document.getElementById("actualGold").innerHTML = round5(gold);
                document.getElementById("goldPerSecond").innerHTML = round5(goldToAdd/10);
            }
            if(prevState.wood !== wood) {
                let woodToAdd = castle.helpers.woodToAdd();
                document.getElementById("wood").innerHTML = intToString(wood, 1);
                document.getElementById("woodPerTick").innerHTML = intToString(woodToAdd, 1);
                document.getElementById("actualWood").innerHTML = round5(wood);
                document.getElementById("woodPerSecond").innerHTML = round5(woodToAdd/10);
            }
        },
        updateLists: function() {
            for (let i = 0; i < actionsList.nextNames.length; i++) {
                let name = actionsList.nextNames[i];
                if(!prevState.next || prevState.next[name].length !== actionsList.next[name].length) {
                    view.actionList.createNextList(i);
                    continue;
                }
                for (let j = 0; j < actionsList.next[name].length; j++) {
                    let prevAction = prevState.next[name][j];
                    let nextAction = actionsList.next[name][j];
                    if(!prevAction ||
                        prevAction.varName !== nextAction.varName) {
                        view.actionList.createNextList(i);
                        break;
                    } else if(prevAction.loops !== nextAction.loops) { //keeps tab order as you change loop numbers
                        document.getElementById("loopInput"+j+name).value = nextAction.loops;
                    }
                }
            }
            for (let i = 0; i < actionsList.nextNames.length; i++) {
                let name = actionsList.nextNames[i];
                if(!prevState.current || prevState.current[name].length !== actionsList.current[name].length) {
                    view.actionList.createCurrentList(i);
                    continue;
                }
                for (let j = 0; j < actionsList.current[name].length; j++) {
                    let prevAction = prevState.current[name][j];
                    let curAction = actionsList.current[name][j];
                    if(!prevAction ||
                        prevAction.varName !== curAction.varName ) {
                        view.actionList.createCurrentList(i);
                        break;
                    } else if(prevAction.manaUsed !== curAction.manaUsed
                        || prevAction.loopsLeft !== curAction.loopsLeft
                        || prevAction.loops !== curAction.loops) {
                        if(curAction.costseconds === 0 && curAction.loopsLeft === 0 && curAction.loops > 0) { //completed pause action
                            document.getElementById("action"+j+name+"Bar").style.width = "100%";
                        } else {
                            document.getElementById("action" + j + name + "Bar").style.width = (100 * curAction.manaUsed / (curAction.costseconds * 10)) + "%";
                        }
                        document.getElementById("action"+j+name+"LoopsLeft").innerHTML = curAction.loopsLeft;
                        document.getElementById("action"+j+name+"Loops").innerHTML = curAction.loops;
                        if(curList === i && currentlyHovering === j) { //only update last hovered live
                            view.updating.updateInfoDiv(name, j);
                        }
                    }
                }
                let currentAction = actionsList.current[name][actions.validActions[i]];
                let nextAction = actionsList.current[name][actions.validActions[i]+1];
                document.getElementById(name+"TabSleep").style.opacity = (!currentAction || currentAction.varName === "sleep" ||
                    (currentAction.loopsLeft === 0 && currentAction.manaUsed === currentAction.costseconds*10 && (!nextAction || nextAction.varName === "sleep"))) //pause when next list is empty condition
                    ? ".5" : "0";
            }
        },
        updateInfoDiv: function(name, i) {
            let curAction = actionsList.current[name][i];
            let costsDiv = "";
            costsDiv += "Mana Needed <div class='bold'>"+round1(curAction.costseconds*10 - curAction.manaUsed)+"</div><br>"+
                "In Seconds <div class='bold'>"+round1(curAction.costseconds - curAction.manaUsed/10)+"</div>s<br>";
            if(curAction.costgold) {
                costsDiv += "Next Gold Cost <div class='bold'>"+curAction.costgold+"</div><br>";
            }
            if(curAction.costwood) {
                costsDiv += "Next Wood Cost <div class='bold'>"+curAction.costwood+"</div><br>";
            }
            if(curAction.costmana) {
                costsDiv += "Additional Mana Cost <div class='bold'>"+curAction.costmana+"</div><br>";
            }
            if(curAction.failed) {
                costsDiv += "<br>Times Failed <div class='bold'>"+curAction.failed+"</div><br>" +
                    "Failure Reasons "+curAction.failedReason;
            }
            document.getElementById("action"+i+name+"Costs").innerHTML = costsDiv;
        },
        updateCreated: function() {
            for (let property in created.castle) {
                if (!prevState.created || created.castle.hasOwnProperty(property) &&
                    JSON.stringify(created.castle[property]) !== JSON.stringify(prevState.created.castle[property])) {
                    document.getElementById(property+"Num").innerHTML = created.castle[property];
                    document.getElementById(property+"Num").style.opacity = created.castle[property] === 0 ? "0" : "1";
                }
            }
        },
        updateUnits: function() {
            let prevLevelDatum = prevState.levelData;

            //initial
            if(!prevLevelDatum) {
                view.helpers.createMapTooltipString("Castle", levelData.home);
                for(let i = 0; i < levelData.dungeons.length; i++) {
                    view.helpers.createMapTooltipString("Dungeon "+(i+1), levelData.dungeons[i]);
                }
                for(let i = 0; i < levelData.hideouts.length; i++) {
                    view.helpers.createMapTooltipString("Hideout "+(i+1), levelData.hideouts[i]);
                }
                return;
            }

            //update castle
            if(prevLevelDatum.home.fightCounter !== levelData.home.fightCounter && document.getElementById("homeFightProgress")) {
                document.getElementById("homeFightProgress").style.width = levelData.home.fightCounter * 5 + "%";
            }
            if(JSON.stringify(prevLevelDatum.home.units) !== JSON.stringify(levelData.home.units)) {
                view.helpers.createMapTooltipString("Castle", levelData.home);
            }

            //update dungeons
            for(let i = 0; i < levelData.dungeons.length; i++) {
                let dungeon = levelData.dungeons[i];
                if(prevLevelDatum.dungeons[i].fightCounter !== dungeon.fightCounter && document.getElementById(dungeon.varName+"FightProgress")) {
                    document.getElementById(dungeon.varName+"FightProgress").style.width = dungeon.fightCounter * 5 + "%";
                }
                if(JSON.stringify(prevLevelDatum.dungeons[i].units) !== JSON.stringify(dungeon.units)) {
                    view.helpers.createMapTooltipString("Dungeon "+(i+1), dungeon);
                }
            }

            //update hideouts
            for(let i = 0; i < levelData.hideouts.length; i++) {
                let hideout = levelData.hideouts[i];
                if(prevLevelDatum.hideouts[i].creates.counter !== hideout.creates.counter) {
                    document.getElementById(hideout.varName+"CreateCounter").innerHTML = hideout.creates.counter;
                }
                if(prevLevelDatum.hideouts[i].fightCounter !== hideout.fightCounter && document.getElementById(hideout.varName+"FightProgress")) {
                    document.getElementById(hideout.varName+"FightProgress").style.width = hideout.fightCounter * 5 + "%";
                }
                if(JSON.stringify(prevLevelDatum.hideouts[i].units) !== JSON.stringify(hideout.units)) {
                    view.helpers.createMapTooltipString("Hideout "+(i+1), hideout);
                }
            }
        },
        updateTraveling: function() {
            let prevLevelDatum = prevState.levelData;

            //update traveling objects
            for(let i = 0; i < levelData.traveling.length; i++) {
                let travelObj = levelData.traveling[i];
                let viewTravelObj;
                //get existing div if it exists
                for(let i = 0; i < viewTravelObjs.length; i++) {
                    if(travelObj.id === viewTravelObjs[i].id) {
                        viewTravelObj = viewTravelObjs[i];
                        break;
                    }
                }

                //create a new one otherwise
                if(!viewTravelObj) {
                    viewTravelObj = view.performance.getNewTravelObj();
                    viewTravelObj.inUse = true;
                    viewTravelObj.div.classList.add('showthat');
                    viewTravelObj.div.style.display = 'block';
                    viewTravelObj.id = travelObj.id;
                    viewTravelObj.div.id = "travelId" + viewTravelObj.id;
                }

                if(!prevLevelDatum.traveling[i] || JSON.stringify(prevLevelDatum.traveling[i].units) !== JSON.stringify(travelObj.units) || prevLevelDatum.traveling[i].target !== travelObj.target) {
                    let image = view.helpers.getTravelingImage(travelObj);
                    let unitString = view.helpers.getUnitString(travelObj.units);
                    viewTravelObj.div.innerHTML = image +
                        "<div class='showthis'><div class='mapTooltipRow'>"+unitString+"</div></div>";
                }

                let coords = view.helpers.translateToWarMapCoords(travelObj.coords);
                viewTravelObj.div.style.left = (coords.x+10) + "px";
                viewTravelObj.div.style.top = (coords.y+10) + "px";
            }

            //hide divs that don't have a matching ID but are inUse:true
            viewTravelObjs.forEach(function(viewTravelObj) {
                if(!viewTravelObj.inUse) {
                    return;
                }
                let found = false;
                levelData.traveling.forEach(function(travelObj) {
                    if(travelObj.id === viewTravelObj.id) {
                        found = true;
                    }
                });
                if(!found) {
                    viewTravelObj.inUse = false;
                    viewTravelObj.div.style.display = 'none';
                }
            });
        },
        updateKingTab: function() {
            let updateRapportGain = false;
            let noPrevKing = !(prevState.king && prevState.king.savedData && prevState.king.curData);
            if(noPrevKing || prevState.king.savedData.int !== king.savedData.int) {
                document.getElementById("int").innerHTML = round5(king.savedData.int);
            }
            if(noPrevKing || prevState.king.savedData.wis !== king.savedData.wis) {
                document.getElementById("wis").innerHTML = king.savedData.wis + "";
                document.getElementById("knowledgeRate").innerHTML = king.savedData.wis + "";
            }
            if(noPrevKing || prevState.king.savedData.cha !== king.savedData.cha) {
                document.getElementById("cha").innerHTML = king.savedData.cha + "";
                updateRapportGain = true;
            }
            if(noPrevKing || prevState.king.curData.rflxCur !== king.curData.rflxCur) {
                document.getElementById("rflxCur").innerHTML = king.curData.rflxCur + "";
            }
            if(noPrevKing || prevState.king.savedData.exp !== king.savedData.exp) {
                document.getElementById("kingLevel").innerHTML = king.helpers.getLevel();
                let expNeeded = king.helpers.getExpOfLevel(king.helpers.getLevel());
                document.getElementById("exp").innerHTML = "<b>"+king.savedData.exp+"</b> / <b>"+expNeeded+"</b> exp";
                let expOfPrev = king.helpers.getExpOfLevel(king.helpers.getLevel()-1);
                document.getElementById("expProgress").style.width = 100 * (king.savedData.exp - expOfPrev) / (expNeeded - expOfPrev) + "%";

                document.getElementById("rflxCap").innerHTML = king.savedData.rflxCap + "";
                document.getElementById("rflxGain").innerHTML = intToString((king.savedData.rflxCap - king.curData.rflxCur)/100);
            }
            if(noPrevKing || prevState.king.curData.aura !== king.curData.aura) {
                let color = king.helpers.kingIsHome() ? "rgba(255, 255, 0, 1)" : "rgba(255, 255, 0, .4)";
                let hidden = "rgba(255, 255, 0, 0)";
                document.getElementById("directContainer").style.border = "2px solid " + hidden;
                document.getElementById("communeContainer").style.border = "2px solid " + hidden;
                document.getElementById("marketContainer").style.border = "2px solid " + hidden;
                if(king.curData.aura === "gold") {
                    document.getElementById("marketContainer").style.border = "2px solid " + color;
                } else if(king.curData.aura === "wood") {
                    document.getElementById("communeContainer").style.border = "2px solid " + color;
                } else if(king.curData.aura === "build") {
                    document.getElementById("directContainer").style.border = "2px solid " + color;
                }
            }

            let noPrevLevelSave = !(prevState.levelSave);
            if(noPrevLevelSave || prevState.levelSave.knowledgeCap !== levelSave[curLevel].knowledgeCap) {
                document.getElementById("knowledgeCap").innerHTML = levelSave[curLevel].knowledgeCap;
            }
            if(noPrevLevelSave || prevState.levelSave.secrets !== levelSave[curLevel].secrets) {
                document.getElementById("secrets").innerHTML = levelSave[curLevel].knowledgeCap;
            }
            if(noPrevLevelSave || prevState.levelSave.knowledge !== levelSave[curLevel].knowledge) {
                document.getElementById("knowledge").innerHTML = levelSave[curLevel].knowledge;
            }

            let noPrevLevelData = !(prevState.levelData && prevState.levelData.data);
            if(noPrevLevelData || prevState.levelData.data.person !== levelData.data.person) {
                document.getElementById("personNum").innerHTML = levelData.data.person + "";
            }
            if(noPrevLevelData || prevState.levelData.data.difficulty !== levelData.data.difficulty) {
                document.getElementById("difficulty").innerHTML = levelData.data.difficulty + "";
            }
            if(noPrevLevelData || prevState.levelData.data.rapport !== levelData.data.rapport) {
                let rapportNeeded = 10 * levelData.data.difficulty;
                if(king.savedData.cha < levelData.data.difficulty) {
                    rapportNeeded += Math.pow((levelData.data.difficulty - king.savedData.cha), 2)*5
                }
                document.getElementById("rapport").innerHTML = intToStringRound(levelData.data.rapport) + " / " + intToStringRound(rapportNeeded) + " rapport";
                document.getElementById("rapportProgress").style.width = (100 * levelData.data.rapport / rapportNeeded) + "%";
            }
            if(noPrevLevelData || prevState.levelData.initial.people !== levelData.initial.people) {
                document.getElementById("mapMaxPeople").innerHTML = levelData.initial.people + "";
                updateRapportGain = true;
            }
            if(updateRapportGain) {
                let rapportBonus = king.helpers.calcRapportBonus();
                let allDivs = "<div class='smallTitle'>Most People Met</div>";

                let allZero = true;
                for(let i = 0; i < levelSave[curLevel].highestPerson.length; i++) {
                    let highestPerson = levelSave[curLevel].highestPerson[i];
                    if(highestPerson.person === 0) {
                        continue;
                    }
                    allDivs += "Met <b>" + highestPerson.person + "</b> people <b>" + highestPerson.amount + "</b> times<br>";
                }
                if(allZero) {
                    allDivs += "Nobody met yet.<br>"
                }

                allDivs += "Current Bonus: <b>" + round((rapportBonus-1)*100) + "</b>%";
                document.getElementById("personHighest").innerHTML = allDivs;
                document.getElementById("rapportAdded").innerHTML = intToString(king.savedData.cha * rapportBonus);
            }

        }
    },
    actionList: {
        createNextList: function(num) {
            view.performance.clearNextListeners(num);
            let name = actionsList.nextNames[num];
            let theDiv = document.getElementById(name + "NextActions");

            let totalDivText = "";

            let theList = actionsList.next[name];
            for (let i = 0; i < theList.length; i++) {
                let action = theList[i];
                let capButton = "";
                let image = view.helpers.getImage(action, num);
                totalDivText +=
                    "<div id='nextActionContainer" + i + name + "' class='nextActionContainer small' ondragover='handleDragOver(event)' ondrop='handleDragDrop(event, "+num+")' ondragstart='handleDragStart(event, \""+name+"\")' ondragend='draggedUndecorate(" + i + ", \""+name+"\")' ondragenter='dragOverDecorate(" + i +", \""+name+"\")' ondragleave='dragExitUndecorate("+i+", \""+name+"\")' draggable='true' data-index='"+i+"'>" +
                    image + " x " +
                    "<input id='loopInput" + i + name + "' type='text' class='listTextInput' value='"+action.loops+"' onchange='setLoop(" + i + ","+num+")' onclick='this.select();'>" +
                    "<div style='float:right;margin-top:4px;'>" +
                    capButton +
                    "<i id='plusButton" + i + name + "' onclick='addLoop(" + i + ","+num+")' class='actionIcon fa fa-plus'></i>" +
                    "<i id='minusButton" + i + name + "' onclick='removeLoop(" + i + ","+num+")' class='actionIcon fa fa-minus'></i>" +
                    "<i id='splitButton" + i + name + "' onclick='split(" + i + ","+num+")' class='actionIcon fa fa-arrows-h'></i>" +
                    "<i id='upButton" + i + name + "' onclick='moveUp(" + i + ","+num+")' class='actionIcon fa fa-sort-up'></i>" +
                    "<i id='downButton" + i + name + "' onclick='moveDown(" + i + ","+num+")' class='actionIcon fa fa-sort-down'></i>" +
                    "<i id='removeButton" + i + name + "' onclick='removeAction(" + i + ","+num+")' class='actionIcon fa fa-times'></i>" +
                    "</div>" +
                    "</div>";
            }

            theDiv.innerHTML = totalDivText;
        },
        createCurrentList: function(num) {
            let name = actionsList.nextNames[num];
            view.performance.clearCurrentListeners(name);
            let theDiv = document.getElementById(name + "CurActions");

            let totalDivText = "";

            let theList = actionsList.current[name];
            for(let i = 0; i < theList.length; i++) {
                let action = theList[i];
                let width = 100 * action.manaUsed / (action.costseconds * 10) + "%";
                let image = view.helpers.getImage(action, num);
                totalDivText +=
                    "<div class='curActionContainer small' id='curAction"+i+name+"' onmouseover='view.actionList.showInfoDiv("+i+", \""+name+"\", true)' onmouseleave='view.actionList.showInfoDiv("+i+", \""+name+"\",false)'>" +
                    "<div class='curActionBar' style='width:"+width+"' id='action"+i+name+"Bar'></div>" +
                    "<div class='actionSelectedIndicator' id='action"+i+name+"Selected'></div>" +
                    image + " x " +
                    "<div id='action"+i+name+"LoopsLeft' style='margin-left:3px'>"+ action.loopsLeft+"</div>(" + "<div id='action"+i+name+"Loops'>" + action.loops + "</div>" + ")" +
                    "</div>";
            }

            theDiv.innerHTML = totalDivText;

            totalDivText = "";

            for(let i = 0; i < theList.length; i++) {
                let action = theList[i];
                totalDivText +=
                    "<div id='actionTooltip"+i+name+"' style='display:none;padding-left:10px;width:90%'>" +
                    "<div style='text-align:center;width:100%'>"+action.name+"</div><br><br>" +
                    "<div id='action"+i+name+"Costs'></div>" +
                    "</div>";
            }

            view.actionInfoDiv[name].innerHTML = totalDivText;
            view.actionList.showInfoDiv(0, name, false);
        },
        showInfoDiv: function(i, name, isHover) {
            const div = document.getElementById("action"+i+name+"Selected");
            currentlyHovering = i;
            if(div) {
                div.style.opacity = isHover ? "1" : "0";
                document.getElementById("actionTooltip"+i+name).style.display = isHover ? "inline-block" : "none";
                if(isHover) {
                    view.updating.updateInfoDiv(name, i);
                }
            }
            view.actionInfoDiv[name].style.display = isHover ? "inline-block" : "none";
            if(actionsList.nextNames[curList] === name) {
                document.getElementById("optionsDiv").style.display = isHover ? "none" : "inline-block";
            }
        }
    },
    performance: {
        clearNextListeners: function(num) {
            let name = actionsList.nextNames[num];
            let theDiv = document.getElementById(name + "NextActions");

            let count = 0;
            while (theDiv.firstChild) {
                if (document.getElementById("capButton" + count + name)) {
                    document.getElementById("capButton" + count + name).removeAttribute("onclick");
                }
                document.getElementById("loopInput" + count + name).removeAttribute("onclick");
                document.getElementById("loopInput" + count + name).removeAttribute("onchange");
                document.getElementById("plusButton" + count + name).removeAttribute("onclick");
                document.getElementById("minusButton" + count + name).removeAttribute("onclick");
                document.getElementById("splitButton" + count + name).removeAttribute("onclick");
                document.getElementById("upButton" + count + name).removeAttribute("onclick");
                document.getElementById("downButton" + count + name).removeAttribute("onclick");
                document.getElementById("removeButton" + count + name).removeAttribute("onclick");

                let dragAndDropDiv = document.getElementById("nextActionContainer" + count + name);
                dragAndDropDiv.removeAttribute("ondragover");
                dragAndDropDiv.removeAttribute("ondrop");
                dragAndDropDiv.removeAttribute("ondragstart");
                dragAndDropDiv.removeAttribute("ondragend");
                dragAndDropDiv.removeAttribute("ondragenter");
                dragAndDropDiv.removeAttribute("ondragleave");

                while (theDiv.firstChild.firstChild) {
                    if (theDiv.firstChild.firstChild instanceof HTMLImageElement) {
                        theDiv.firstChild.firstChild.src = '';
                    }
                    theDiv.firstChild.removeChild(theDiv.firstChild.firstChild);
                }
                theDiv.removeChild(theDiv.firstChild);
                count++;
            }
        },
        clearCurrentListeners: function(name) {
            let theDiv = document.getElementById(name + "CurActions");

            let count = 0;
            while (theDiv.firstChild) {
                document.getElementById("curAction" + count + name).removeAttribute("onmouseover");
                document.getElementById("curAction" + count + name).removeAttribute("onmouseleave");

                theDiv.removeChild(theDiv.firstChild);
                count++;
            }
        },
        getNewTravelObj: function() {
            //get one that isn't being used from the pool
            for(let i = 0; i < viewTravelObjs.length; i++) {
                if(!viewTravelObjs[i].inUse) {
                    return viewTravelObjs[i];
                }
            }

            //create a new one
            let travelDiv = document.createElement("div");
            travelDiv.style.position = "absolute";
            let newTravelObj = {div:travelDiv};
            viewTravelObjs.push(newTravelObj);
            document.getElementById("warMapActions").appendChild(travelDiv);
            return newTravelObj;
        }
    },
    clickable: {
        initial: {
            createCastleIcons: function () {
                let container = document.getElementById("castleActions");
                let allDivs = "";
                castle.actions.forEach(function(action) {
                    let costDesc = view.helpers.getCostsString(action.cost);

                    let desc = action.desc + "<br>Adds to the Castle queue.<br>" + costDesc;

                    allDivs +=
                        '<div id="'+action.varName+'Container" onclick="addActionToList(\''+action.varName+'\', 1, true)" class="clickable abs showthat" style="left:'+action.xPos+'px;top:'+action.yPos+'px;">' +
                        '<img src="img/' + action.varName + '.svg" class="superLargeIcon imageDragFix">' +
                        '<div class="showthisUp" style="width:250px">' +
                        '<div class="smallTitle">'+action.name+'</div>' +
                        '<div class="small">'+desc+'</div>' +
                        '</div>' +
                        '</div>' +
                        '<div id="'+action.varName+'Num" class="createdNum abs" style="left:'+(action.xPos+10)+'px;top:'+(action.yPos+43)+'px;"></div>';
                });
                container.innerHTML = allDivs;
            },
            createWarMap: function() {
                createLevel(curLevel);
                warMap.actions.createWarMapActions(levelData);
                let allDivs = "";

                warMap.bases.getAllBases().forEach(function(base) {
                    let coords = view.helpers.translateToWarMapCoords(base.coords);
                    let imageName = base.varName.split("_")[0];
                    allDivs +=
                        '<div style="position:absolute;left:'+coords.x+'px;top:'+(coords.y)+'px;">' +
                            '<div class="mapFriendlyHPBar" id="'+base.varName+'FriendlyHPBar" style="position:absolute;top:-10px"><div id="'+base.varName+'FriendlyHP"></div></div>' +
                            '<div class="mapEnemyHPBar" id="'+base.varName+'EnemyHPBar" style="position:absolute;top:-4px"><div id="'+base.varName+'EnemyHP"></div></div>' +
                            '<div class="clickable showthat" style="position:absolute;top:0;left:0" onclick="addActionToList(\''+base.varName+'\', 2, true)">' +
                                '<img src="img/'+imageName+'.svg" class="superLargeIcon imageDragFix">' +
                                '<div class="showthis" id="'+base.varName+'Tooltip"></div>' +
                            '</div>' +
                            (base.creates ? ('<div class="createCounter" style="position:absolute;left:-20px;top:43px;width:80px">' +
                                '<img src="img/enemy.svg" class="smallIcon imageDragFix">: <div id="'+base.varName+'CreateCounter">'+base.creates.counter+'</div>'+
                            '</div>') : "") +
                        '</div>';
                });

                document.getElementById("warMapActions").innerHTML = allDivs;
                //re-add divs created from traveling units
                viewTravelObjs.forEach(function(viewTravelObj) {
                    document.getElementById("warMapActions").appendChild(viewTravelObj.div);
                });
            },
            createKingIcons: function() {
                let container = document.getElementById("kingActions");
                let allDivs = "";
                king.actions.forEach(function(action) {
                    let costDesc = view.helpers.getCostsString(action.cost);

                    let desc = action.desc + "<br>Adds to the King queue.<br>" + costDesc;

                    allDivs +=
                        '<div id="'+action.varName+'Container" onclick="addActionToList(\''+action.varName+'\', 0, true)" class="clickable abs showthat" style="left:'+action.xPos+'px;top:'+action.yPos+'px;">' +
                        '<img src="img/' + action.varName + '.svg" class="superLargeIcon imageDragFix">' +
                        '<div class="showthisUp" style="width:250px">' +
                        '<div class="smallTitle">'+action.name+'</div>' +
                        '<div class="small">'+desc+'</div>' +
                        '</div>' +
                        '</div>' +
                        '<div id="'+action.varName+'Num" class="createdNum abs" style="left:'+(action.xPos+10)+'px;top:'+(action.yPos+43)+'px;"></div>';
                });
                container.innerHTML = allDivs;
            }
        }
    },
    helpers: {
        createMapTooltipString: function(titleName, base) {
            let tooltipDiv = "<div class='mapTooltipRow'><div class='title'>"+titleName+"</div>"
                + "<div style='opacity:.7;position:absolute;top:0;right:0'>(" + base.coords.x +", "+base.coords.y + ")</div>";
            let unitsByAllegience = warMap.bases.getUnitsByAllegiance(base);
            let totalHp = warMap.bases.getTotalHP(base);
            if(unitsByAllegience.friendly.length > 0) {
                tooltipDiv += "<div>Your Units</div><br>";
                tooltipDiv += view.helpers.getUnitString(unitsByAllegience.friendly);
            }
            if(unitsByAllegience.friendly.length > 0 && unitsByAllegience.enemy.length > 0) {
                tooltipDiv += "<div style='display:block;text-align:center;position:relative;'>" +
                    "Fight!"+
                    "<div style='position:absolute;background-color:rgba(255,0,0,0.3);height:100%;left:0;' id='"+base.varName+"FightProgress'></div>" +
                    "</div>"
            }
            if(unitsByAllegience.enemy.length > 0) {
                tooltipDiv += "<div>Enemy Units</div><br>";
                tooltipDiv += view.helpers.getUnitString(unitsByAllegience.enemy);
            }
            if(base.reward) {
                for(let i = 0; i < base.reward.length; i++) {
                    let nextReward = base.reward[i];
                    tooltipDiv += "Gain <b>" + nextReward.amount + "</b> " + nextReward.type + " when cleared. ";
                }
            }
            if(base.initialFriendlyHP && totalHp.friendly > 0) {
                document.getElementById(base.varName + "FriendlyHPBar").style.display = "block";
                document.getElementById(base.varName + "FriendlyHP").style.width = (100 * totalHp.friendly / base.initialFriendlyHP) + "%";
            } else {
                document.getElementById(base.varName + "FriendlyHPBar").style.display = "none";
            }
            if(base.initialEnemyHP && totalHp.enemy > 0) {
                document.getElementById(base.varName + "EnemyHPBar").style.display = "block";
                document.getElementById(base.varName + "EnemyHP").style.width = (100 * totalHp.enemy / base.initialEnemyHP) + "%";
            } else {
                document.getElementById(base.varName + "EnemyHPBar").style.display = "none";
            }
            tooltipDiv += "</div>"; //closing mapTooltipRow
            document.getElementById(base.varName + "Tooltip").innerHTML = tooltipDiv;
        },
        translateToWarMapCoords: function(coords) { //x,y 0-190,0-100, translated to x:10-550 and y:15-300
            return {x:10+(coords.x / 190 * 541), y:15+(coords.y / 100 * 285)};
        },
        getUnitString: function(unitList) {
            let total = { atk:0, hp:0, exp:0 };
            let tooltipDiv = "";
            unitList.forEach(function(unit) {
                let num = unit.amount;
                total.atk += unit.atk * num;
                total.hp += unit.hp * num;
                let exp = (unit.exp ? unit.exp * num : 0);
                total.exp += exp;
                tooltipDiv += "<div style='width:20px'><div class='bold'>" + num + "</div></div>" +
                    "<div style='width:80px'>" + capitalizeFirst(unit.varName) + "</div>" +
                    "<div style='width:60px'>Atk: <div class='bold'>"+ unit.atk + "</div></div>" +
                    "<div style='width:60px'>HP: <div class='bold'>"+ unit.hp + "</div></div>" +
                    (total.exp === 0 ? "" : "<div style='width:60px'>Exp: <div class='bold'>"+ exp + "</div></div>") +
                    "<br>";
            });
            tooltipDiv += "<div style='width:100px'>Total</div>" +
                "<div style='width:60px'>Atk: <div class='bold'>"+ total.atk + "</div></div>" +
                "<div style='width:60px'>HP: <div class='bold'>"+ total.hp + "</div></div>" +
                (total.exp === 0 ? "" : "<div style='width:60px'>Exp: <div class='bold'>"+ total.exp + "</div></div>") +
                "<br>";
            return tooltipDiv;
        },
        getImage: function(action, num) {
            if(num !== 2 || action.varName === "sleep") {
                return "<img src='img/" + action.varName + ".svg' class='smallIcon imageDragFix' style='margin-left:5px'>";
            } else {
                if(action.unitsToMove) {
                    let images = "";
                    for (let property in action.unitsToMove) {
                        if (action.unitsToMove.hasOwnProperty(property) && action.unitsToMove[property]) {
                            images += "<img src='img/"+property+".svg' class='smallIcon imageDragFix' style='margin-left:1px'>";
                        }
                    }
                    images += "<div class='fa fa-arrow-right'></div>";
                    if (action.varName === "home") {
                        images += "<img src='img/home.svg' class='smallIcon imageDragFix' style='margin-left:1px'>";
                    } else {
                        let imageType = action.varName.split("_")[0];
                        images += "<img src='img/" + imageType + ".svg' class='smallIcon imageDragFix' style='margin-left:1px'>";
                        let typeNum = parseInt(action.varName.split("_")[1]);
                        images += "<div class='bold'>" + (typeNum + 1) + "</div>";
                    }
                    return images;
                } else {
                    //hero actions?
                }
            }
        },
        getTravelingImage: function(travelObj) {
            // king > heroes > army
            let imageType = "units";
            for(let i = 0; i < travelObj.units.length; i++) {
                if(travelObj.units[i].type === "heroes") {
                    imageType = "heroes";
                }
                if(travelObj.units[i].type === "king") {
                    imageType = "king";
                    break;
                }
                if(!travelObj.units[i].isFriendly) {
                    imageType = "enemy";
                    break;
                }
            }
            return "<img src='img/" + imageType + ".svg' class='largeIcon imageDragFix' style=''>";
        },
        getCostsString: function(costs) {
            let costDesc = "";
            let first = true;
            costs.forEach(function(cost) {
                if(first) {
                    costDesc += "Costs ";
                    first = false;
                } else {
                    costDesc += " Also takes ";
                }
                if(cost.type === "linear") {
                    costDesc += cost.starting + " " + cost.resource + " to start, and " + cost.growth + " more each time after that.";
                } else if(cost.type === "static") {
                    costDesc += cost.starting + " " + cost.resource+"."
                }
            });
            return costDesc;
        }
    }
};

let viewTravelObjs = []; //for re-using divs