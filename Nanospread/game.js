
function createGrid() {
    var startingCoords = {x:0,y:0};
    for (var column = 0; column < levelData[0].length; column++) {
        theGrid[column] = [];
        for (var row = 0; row < levelData.length; row++) {
            if(!levelData[row][column]) {
                continue;
            }
            var squareCoords = {x:column,y:row};
            var distanceFromCenter = Math.sqrt(Math.pow((squareCoords.x-startingCoords.x),2)+Math.pow((squareCoords.y-startingCoords.y),2));
            var initialConsumeCost = Math.pow(distanceFromCenter, 2) * Math.pow(levelData[row][column], 2)*30;
            theGrid[column][row] =  new Square(squareCoords.x, squareCoords.y, initialConsumeCost);
        }
    }

    for (column = 0; column < theGrid.length; column++) {
        for (row = 0; row < theGrid[column].length; row++) {
            var square = theGrid[column][row];
            if(square) {
                square.chooseStartingDirection(); //All of them have a transfer target
            }
        }
    }

    theGrid[startingCoords.x][startingCoords.y].gainNanites(1);
}

function tick() {
    if(stop) {
        return;
    }
    timer++;
    handleFPSDifference();
    clearNanitesReceived();
    sendNanites();

    if(!theView) {
        theView = new View();
    }
    theView.update();
}

function sendNanites() {
    for (var column = 0; column < theGrid.length; column++) {
        for (var row = 0; row < theGrid[column].length; row++) {
            var square = theGrid[column][row];
            if(square && square.isActive()) {
                var target = theGrid[square.targetCol][square.targetRow];
                if(target.isActive()) {
                    target.gainAdvBots(square.sendPieceOfAdvBots()); //transfer .1% advBots
                }
                var amountTransferred = square.sendPieceOfNanites();
                target.gainNanites(amountTransferred); //transfer .1% nanites
                target.naniteAmountReceived += amountTransferred;

                amountTransferred = square.sendPieceOfAdvBots();
                target.gainAdvBots(amountTransferred); //transfer .1% adv bots
                target.advBotAmountReceived += amountTransferred;

                square.gainNanites(square.naniteRate);
                square.gainAdvBots(square.advBotRate);
            }
        }
    }
}

function clearNanitesReceived() {
    for (var column = 0; column < theGrid.length; column++) {
        for (var row = 0; row < theGrid.length; row++) {
            var square = theGrid[column][row];
            if(square) {
                var target = theGrid[square.targetCol][square.targetRow];
                target.naniteAmountReceived = 0;
                target.advBotAmountReceived = 0;
            }
        }
    }
}

function clickedSquare(col, row) {
    var square = theGrid[col][row];
    square.isSelected = !square.isSelected;
    var pos = selected.indexOf(square);
    if(pos === -1) {
        if(!settings.selectOneOrMultiple && selected.length >= 1) { //single
            theView.setSelectedFalse();
            selected = [];
            selected.push(square);
        } else { //multiple
            selected.push(square);
        }
        theView.updateInfoBox();
    } else {
        theView.changeBorderSelected(square);
        selected.splice(pos, 1);
        theView.updateInfoBox();
    }
    showOrHideBox();
}
function deselectAll() {
    if(selected.length === 0) {
        return;
    }
    theView.setSelectedFalse();
    selected = [];
    theView.updateInfoBox();
    closeSettingsBox();
    showOrHideBox();
}

function changeDirectionOfSelected(direction) {
    if(selected.length === 0) {
        return;
    }
    for(var i = 0; i < selected.length; i++) {
        selected[i].changeTargetDirection(direction);
        if(!selected[i].getTarget()) {
            selected[i].chooseStartingDirection();
        }
    }
    theView.updateInfoBox();
    for(i = 0; i < selected.length; i++) {
        theView.updateDirectionDot(selected[i]);
    }
}

function buyAll() {
    for(var i = 0; i < selected.length; i++) {
        if(selected[i].isActive() && selected[i].canBuyNanitesAfterMultiBuy()) {
            selected[i].buyMultipleNanites(settings.buyPerClick);
        }
    }
}
function buyNanitesButtonPressed() {
    if(selected.length === 0) {
        return;
    }
    if(settings.buyLowestOrAll) {
        buyAll();
    } else {
        buyLowest();
    }
    theView.updateInfoBox();
    for(var i = 0; i < selected.length; i++) {
        theView.updateDisplayNum(selected[i], settings.selectedResourceNum === 0 ? 'nanite' : 'advBot');
    }
}
function buyLowest() {
    var lowestAmountSquares = getLowestSquares(getSelectedActive(), 'nanite');
    var allBuyable = true;
    for(var i = 0; i < lowestAmountSquares.length; i++) {
        allBuyable = allBuyable && lowestAmountSquares[i].canBuyNanitesAfterMultiBuy();
    }
    if(allBuyable) {
        for(i = 0; i < lowestAmountSquares.length; i++) {
            lowestAmountSquares[i].buyMultipleNanites(settings.buyPerClick);
        }
    }
}

function buyAdvBotsButtonPressed() {
    for(var i = 0; i < selected.length; i++) {
        if(selected[i].canBuyAdvBots()) {
            selected[i].buyAdvBots();
        }
    }
    theView.updateInfoBox();
}

function getLowestSquares(list, resourceType) {  //gets all the Squares with the lowest upgrade amount
    var lowestAmountSquares;
    for(var i = 0; i < list.length; i++) {
        if(!lowestAmountSquares) {
            lowestAmountSquares = [list[i]];
            continue;
        }
        if(list[i][resourceType + 'Amount'] < lowestAmountSquares[0][resourceType + 'Amount']) {
            lowestAmountSquares = [];
            lowestAmountSquares.push(list[i]);
        } else if(list[i][resourceType + 'Amount'] === lowestAmountSquares[0][resourceType + 'Amount']) {
            lowestAmountSquares.push(list[i]);
        }
    }
    return lowestAmountSquares ? lowestAmountSquares : [];
}
function getLowestSquare(list, resourceType) {
    var lowestSquare;
    for(var i = 0; i < list.length; i++) {
        if(!lowestSquare) {
            lowestSquare = list[i];
            continue;
        }
        if(list[i][resourceType + 'Amount'] < lowestSquare[resourceType + 'Amount'] ||
            (list[i][resourceType + 'Amount'] === lowestSquare[resourceType + 'Amount'] && list[i][resourceType + 's'] < lowestSquare[resourceType + 's'])) {
            lowestSquare = list[i];
        }
    }
    return lowestSquare;
}
function getSelectedActive() {
    var selectedActive = [];
    for(var i = 0; i < selected.length; i++) {
        if(selected[i].isActive()) {
            selectedActive.push(selected[i]);
        }
    }
    return selectedActive;
}
function getSelectedInactive() {
    var selectedInactive = [];
    for(var i = 0; i < selected.length; i++) {
        if(!selected[i].isActive()) {
            selectedInactive.push(selected[i]);
        }
    }
    return selectedInactive;
}
function getLowestInactiveSquare(list) {
    var lowestInactive;
    for(var i = 0; i < list.length; i++) {
        if(!lowestInactive) {
            lowestInactive = list[i];
            continue;
        }
        if(list[i].consumeCost < lowestInactive.consumeCost) {
            lowestInactive = list[i];
        }
    }
    return lowestInactive;
}




function handleFPSDifference() {
    timeList.push(new Date().getTime());
    if(timeList.length > 10) {
        timeList.splice(0, 1);
        var fps = msWaitTime/((timeList[timeList.length-1] - timeList[0]) / (timeList.length-1))*100;
        multFromFps = 100/fps;
        //$scope.fps = round(fps)+"%";
    } else {
        multFromFps = 1;
        //$scope.fps = "...";
    }
}