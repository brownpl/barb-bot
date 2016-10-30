var Botkit = require('botkit')

var token = process.env.SLACK_TOKEN
var deck = []; 

var controller = Botkit.slackbot({
	// reconnect to Slack RTM when connection goes bad
	retry: Infinity,
	debug: false
})

// Assume single team mode if we have a SLACK_TOKEN
if (token) {
	console.log('Starting in single-team mode')
	controller.spawn({
		token: token,
		retry: Infinity
	}).startRTM(function (err, bot, payload) {
		if (err) {
			throw new Error(err)
		}

		console.log('Connected to Slack RTM')
	})
// Otherwise assume multi-team mode - setup beep boop resourcer connection
} else {
	console.log('Starting in Beep Boop multi-team mode')
	require('beepboop-botkit').start(controller, { debug: true })
}

controller.on('bot_channel_join', function (bot, message) {
	bot.reply(message, "I'm here!")
})

controller.hears(['work'], ['direct_mention'], function (bot, message) {
	bot.reply(message, 'Does someone have the job code for that?')
})
controller.hears(['girls'], ['ambient'], function (bot, message) {
	bot.reply(message, ':gg-blanche: :gg-dorothy: :gg-sophia: :gg-rose: Thank you for being a friend :heart:')
})

controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
	var help = 'I will respond to the following messages: \n' +
			'`@barb blackjack` will play a game of blackjack.\n' +
			'`@barb help` to see this again.'
	bot.reply(message, help)
})




controller.hears('blackjack', ['direct_mention'], function(bot, message){
	createDeck();
	var you = [];
	var dealer = [];
	bot.startConversation(message, function(err, convo) {

		convo.say('So you feel lucky, punk? Ok, here we go....');
			you.push(deck.pop());
			you.push(deck.pop());
			dealer.push(deck.pop());
			dealer.push(deck.pop());
			convo.say('Here are your cards:');
			var hand = '';
			for(var i=0;i<you.length;i++)
			{
				hand += you[i]+" ";
			} 
			convo.say(hand);

			convo.say('I have a '+dealer[0]+ ' showing.');
			convo.ask('What do you want to do? Hit, stay or quit?', [
					{
							pattern: 'hit',
							callback: function(response, convo) {
									convo.say('One hit, coming up!');
									you.push(deck.pop());
									yourHand = tallyHand(you);
									if(yourHand.score >21)
									{
										giveSummary(you, dealer, convo);
									}
									else
									{
										convo.say(yourHand.text + "  ("+yourHand.score+")");
										convo.repeat();
									}
									convo.next();
							},
					},
					{
							pattern: 'stay',
							callback: function(response, convo) {
									dealerHand = tallyHand(dealer);
									while(dealerHand.score < 18)
									{
										dealer.push(deck.pop());
										dealerHand = tallyHand(dealer);
									}
									giveSummary(you, dealer, convo);
									convo.next();
							},
					},
					{
							pattern: 'quit',
							callback: function(response, convo) {
								convo.say("No problem. I was going to win anyway.");
									convo.next();
							},
					},
					{
							default: true,
							callback: function(response, convo) {
									convo.repeat();
									convo.next();
							},
					}
			]);

			convo.activate();
	});
});

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
	bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
})

function createDeck()
{
	var numbers = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
	var suits = [':hearts:',':clubs:',':spades:',':diamonds:'];
	for(var i=0; i<suits.length; i++)
	{
		for(var j=0; j<numbers.length;j++)
		{
			deck.push(suits[i]+numbers[j]);
		}
	}
	deck.shuffle();
} 

function tallyHand(hand){
	var text = '';
	var score =0;
	var aces =0;
	for(var i=0;i<hand.length;i++)
	{
		text += hand[i]+" ";
		if(num = hand[i].match(/(\d+)/))
		{
			score += Number(num[1]);
		}
		else if(num = hand[i].match(/(J|Q|K)$/))
		{
			score += 10;
		}
		else
		{
			aces++;
		}
	}

	if(aces>1)
	{
		score += aces;
	}
	else if(aces==1)
	{
		if(score+11 > 21)
		{
			score +=1;
		}
		else 
		{
			score += 11;
		}
	}

	return { text: text, score: score};
}

function giveSummary(you, dealer, convo){
	convo.say('Here are your cards:');
	yourHand = tallyHand(you);
	convo.say(yourHand.text+ "  ("+yourHand.score+")");
	if(yourHand.score==21)
	{
		convo.say('Yowza! Blackjack! Niiice.');
	}
	convo.say('Here are my cards:');
	dealerHand = tallyHand(dealer);
	convo.say(dealerHand.text + "  ("+dealerHand.score+")");
	if(dealerHand.score==21)
	{
		convo.say('Blackjack! I can\'t be stopped.');
	}

	if(yourHand.score>21)
	{
		convo.say(":boom: YOU BUSTED. lolol.");
	}
	else if(dealerHand.score>21)
	{
		convo.say(":expressionless: I busted. You got lucky this time.");
	}
	else if(yourHand.score == dealerHand.score)
	{
		convo.say('Well, I guess we are both amazing. :kissing_heart:');
	}
	else if(yourHand.score > dealerHand.score)
	{
		convo.say('Congratulations! You beat me! :tada:');
	}
	else
	{
		convo.say('Better luck next time, loser. :smirk:');
	}
}

Array.prototype.shuffle = function() {
	var i = this.length, j, temp;
	if ( i == 0 ) return this;
	while ( --i ) {
		j = Math.floor( Math.random() * ( i + 1 ) );
		temp = this[i];
		this[i] = this[j];
		this[j] = temp;
	}
	return this;
}