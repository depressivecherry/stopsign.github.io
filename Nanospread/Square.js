function Square(col,row,initialConsumeCost) {
    this.col = col;
    this.row = row;
    this.targetRow = 0;
    this.targetCol = 0;
    this.isHovered = 0;
    this.isSelected = 0;

    this.transferRate = 1;

    this.nanites = 0;
    this.naniteRate = 0;
    this.naniteCost = 10;
    this.naniteAmount = 0;
    this.curSpecialPosNanites = 0;
    this.naniteAmountBonus = 1;
    this.naniteTransferAmount = 0;
    this.naniteAmountReceived = 0;
    this.naniteNextSpecial = 10;
    this.advBots = 0;
    this.advBotRate = 0;
    this.advBotCost = 10000;
    this.advBotAmount = 0;
    this.curSpecialPosAdvBots = 0;
    this.advBotAmountBonus = 1;
    this.advBotTransferAmount = 0;
    this.advBotAmountReceived = 0;
    this.advBotNextSpecial = 10;
    this.consumeCost = initialConsumeCost;
    this.specialLevels = [0, 10, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 350, 400, 450, 500, 550, 600, 650, 700, 775, 850, 925, 1000, 1100, 1200]; // 45, 70, 100, 135, 175, 220, 270, 325, 385, 450, 520, 595, 675, 760, 850, 945, 1045, 1150, 1260];

    this.buyNanites = function() {
        this.nanites -= this.naniteCost;
        this.naniteAmount++;
        if (this.naniteAmount >= this.specialLevels[this.curSpecialPosNanites+1]) {
            this.naniteAmountBonus = Math.pow(2, (++this.curSpecialPosNanites));
            this.naniteNextSpecial = this.specialLevels[this.curSpecialPosNanites+1]; //for graphics only
        }
        var naniteCostExtra = Math.pow(5, (this.curSpecialPosNanites));
        var amountShift = this.curSpecialPosNanites === 0 ? 0 : this.curSpecialPosNanites*3; //Math.floor(Math.pow((this.curSpecialPosNanites+1), 2)
        this.naniteCost = (this.naniteAmount - this.specialLevels[this.curSpecialPosNanites] + amountShift) * 10 * naniteCostExtra; //Math.ceil(Math.pow(1.2, this.naniteAmount)*10) * naniteCostExtra;
        this.naniteRate = this.naniteAmount * this.naniteAmountBonus;
    };
    this.buyMultipleNanites = function(num2) {
        var num = settings.buyPerClick - this.naniteAmount % settings.buyPerClick;
        for(var j = 0; j < num; j++) {
            this.buyNanites();
        }
    };
    this.canBuyNanitesAfterMultiBuy = function() {
        var num = settings.buyPerClick - this.naniteAmount % settings.buyPerClick;
        var nextNaniteCost;
        for(var i = 0; i < num; i++) {
            nextNaniteCost = this.naniteCostAfterMultiBuy(num);
        }
        return this.nanites >= nextNaniteCost;
    };
    this.naniteCostAfterMultiBuy = function(num2) {
        var num = settings.buyPerClick - this.naniteAmount % settings.buyPerClick;

        var totalNaniteCost = 0;
        for(var i = 1; i < num+1; i++) {
            totalNaniteCost += this.calcPrice(i);
        }
        return totalNaniteCost;
    };
    this.calcPrice = function(num) {
        var nextNaniteCost = this.naniteCost;
        var tempNanites = this.nanites;
        var tempAmount = this.naniteAmount;
        var tempSpecialPos = this.curSpecialPosNanites;
        var tempNaniteAmountBonus = this.naniteAmountBonus;
        for(var i = 0; i < num-1; i++) {
            tempNanites -= nextNaniteCost;
            tempAmount++;
            if (tempAmount >= this.specialLevels[tempSpecialPos+1]) {
                tempNaniteAmountBonus = Math.pow(2, (++tempSpecialPos));
            }

            var naniteCostExtra = Math.pow(5, (tempSpecialPos));
            var amountShift = tempSpecialPos === 0 ? 0 : tempSpecialPos*3; //Math.floor(Math.pow((this.curSpecialPosNanites+1), 2)
            nextNaniteCost = (tempAmount - this.specialLevels[tempSpecialPos] + amountShift) * 10 * naniteCostExtra; //Math.ceil(Math.pow(1.2, this.naniteAmount)*10) * naniteCostExtra;
        }
        return nextNaniteCost;
    };

    this.canBuyAdvBots = function() {
        return this.nanites >= this.advBotCost;
    };
    this.buyAdvBots = function() {
        this.nanites -= this.advBotCost;
        this.advBotAmount++;
        if (this.advBotAmount >= this.specialLevels[this.curSpecialPosAdvBots]) {
            this.advBotAmountBonus = Math.pow(2, this.curSpecialPosAdvBots);
            this.curSpecialPosAdvBots++;
        }
        this.advBotCost = 10000 + 5000 * Math.pow(this.advBotAmount,2);
        this.advBotRate = this.advBotAmount * this.advBotAmountBonus;
    };
    this.canBuyAdvBotsAfterMultiBuy = function(num) {

    };
    this.advBotCostAfterMultiBuy = function(num) {

    };

    this.initializeIfConsumed = function() {
        if(this.consumeCost <= this.nanites) {
            this.nanites -= this.consumeCost;
            this.naniteAmount++;
            this.naniteRate++;
        }
    };
    this.gainNanites = function(amount) {
        if(this.isActive()) {
            this.nanites+=amount;
            return this.nanites;
        } else {
            this.consumeCost -= amount;
            this.consumeCost = this.consumeCost < 0 ? 0 : this.consumeCost;
            this.initializeIfConsumed();
            return 0;
        }
    };
    this.gainAdvBots = function(amount) {
        if(this.isActive()) {
            this.advBots+=amount;
            return this.advBots;
        }
    };
    this.isActive = function() { return this.naniteAmount > 0; };
    this.sendPieceOfNanites = function() {
        this.naniteTransferAmount = this.nanites * this.transferRate / 100;
        this.nanites -= this.naniteTransferAmount;
        return this.naniteTransferAmount;
    };
    this.sendPieceOfAdvBots = function() {
        this.advBotTransferAmount = Math.floor(this.advBots * this.transferRate / 100);
        this.advBots -= this.advBotTransferAmount;
        return this.advBotTransferAmount;
    };
    this.changeTargetDirection = function(newDirection) {
        if(newDirection === this.transferDirection) {
            return;
        }
        var target = theGrid[this.targetCol] ? theGrid[this.targetCol][this.targetRow] : false;
        if(target) {
            target.naniteAmountReceived = 0;
            target.advBotAmountReceived = 0;
        }

        var tempCol = this.col;
        var tempRow = this.row;
        if(newDirection === "South" ) {
            tempRow = this.row + 1;
        } else if(newDirection === "East") {
            tempCol = this.col + 1;
        } else if(newDirection === "North" ) {
            tempRow = this.row - 1;
        } else if(newDirection === "West") {
            tempCol = this.col - 1;
        }
        this.targetRow = tempRow;
        this.targetCol = tempCol;
        this.transferDirection = newDirection;
    };
    this.chooseStartingDirection = function() {
        this.changeTargetDirection("South");
        if(!this.getTarget()) {
            this.changeTargetDirection("East");
        }
        if(!this.getTarget()) {
            this.changeTargetDirection("North");
        }
        if(!this.getTarget()) {
            this.changeTargetDirection("West");
        }

    };
    this.getTarget = function() {
        return theGrid[this.targetCol] ? theGrid[this.targetCol][this.targetRow] : null;
    };
}