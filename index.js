var Botkit = require('botkit')
var request = require('request');

var token = process.env.SLACK_TOKEN
var deck = []; 
var wheel = [];
var bets = [];
var betMode = false; 


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
			'You can ask @barb for advice, for a fortune or about cats anytime. \n' +
			'If no other commands match, @barb will give you a meme! (; can be used to split text)\n' +
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

controller.hears('roulette', ['direct_mention'], function(bot, message){
	createRouletteBoard();
	var bets = [];
	bot.reply(message, "Alright, place your bets!\nYou can enter a number between 0 and 36, red, black, even or odd.\n(Counting down from 30...)");
	betMode = true;
	setTimeout(function(){ 
		spinWheel(bot, message)
	}, 30000);

});

controller.hears(['^([0-9]|[12]\d|3[0-6])$','odd','even','black','red'], ['ambient'], function(bot, message){
	if(betMode)
	{
		bot.api.users.info({user: message.user}, function(err, info){
			bets.push({ bet: message.match.input, value: message.match.input, user: message.user, profile: info.user.profile.real_name });
		});
	}
});

controller.hears('bets', ['direct_mention'], function(bot, message){
	if(betMode)
	{
		var bet_string = '';
		for(var k=0; k<bets.length; k++)
		{
			bet_string += bets[k].profile +' has bet on '+bets[k].bet+"\n";
		}
		bot.reply(message, bet_string);
	}
	else
	{
		bot.reply(message, 'Roulette ain\'t happening right now, dum-dum.');
	}
});

controller.hears(['opinion.','think'], ['mention','direct_mention'], function(bot, message){
	request(
		{
			url:'http://ron-swanson-quotes.herokuapp.com/v2/quotes', 
			json:true
		}, 
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				bot.reply(message, body[0])
			}
		}
	);
});

controller.hears(['cat.'], ['mention','direct_mention'], function(bot, message){
	request(
		{
			url:'http://catfacts-api.appspot.com/api/facts', 
			json:true
		}, 
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				bot.reply(message, body.facts[0])
			}
		}
	);
});


controller.hears(['advice'], ['mention','direct_mention'], function(bot, message){
	request(
		{
			url:'http://api.adviceslip.com/advice', 
			json:true
		}, 
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				bot.reply(message, body.slip.advice)
			}
		}
	);
});

controller.hears('.*', ['direct_mention'], function (bot, message) {
	var types = ['afraid', 'older', 'aag', 'tried', 'biw', 'blb', 'kermit', 'bd', 'ch', 'cbg', 'wonka', 'cb', 'keanu', 'dsm', 'live', 'ants', 'doge', 'alwaysonbeat', 'ermg', 'facepalm', 'fwp', 'fa', 'fbf', 'fmr', 'fry', 'ggg', 'hipster', 'icanhas', 'crazypills', 'mw', 'noidea', 'regret', 'boat', 'hagrid', 'sohappy', 'captain', 'inigo', 'iw', 'ackbar', 'happening', 'joker', 'ive', 'll', 'morpheus', 'badchoice', 'mmm', 'jetpack', 'red', 'mordor', 'oprah', 'oag', 'remembers', 'philosoraptor', 'jw', 'patrick', 'sad-obama', 'sad-clinton', 'sadfrog', 'sad-bush', 'sad-biden', 'sad-boehner', 'sarcasticbear', 'dwight', 'sb', 'ss', 'sf', 'dodgson', 'money', 'sohot', 'awesome-awkward', 'awesome', 'awkward-awesome', 'awkward', 'fetch', 'success', 'ski', 'officespace', 'interesting', 'toohigh', 'bs', 'center', 'both', 'winter', 'xy', 'buzz', 'yodawg', 'yuno', 'yallgot', 'bad', 'elf', 'chosen'];
	var image = 'https://memegen.link/';
	image += types[Math.floor(Math.random()*types.length)]+"/";
	var replacements = {
		'-':'--',
		'_':'__',
		'\\?':'~q',
		'%':'~p',
		'#':'~h',
		'/':'~s',
		'"':"''"
	}
	var text = message.text;
	for(swap in replacements)
	{ 
		var regex = new RegExp(swap,"g");	
		text = text.replace(regex, replacements[swap])
	}
	if(text.match(/;/))
	{
		var pieces = text.split(';');
		image += encodeURI(pieces[0].trim())+"/"+encodeURI(pieces[1].trim())+".jpg";
	}
	else
	{
		image += encodeURI(text.trim())+".jpg";
	}
	bot.reply(message, image);
})

function createRouletteBoard()
{
	var red = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
	for(var i=0; i<=36; i++)
	{
		if(i==0)
		{
			wheel[i] = { icon: ':green_apple:', number:i, color: 'green' };
		}
		else if(red.indexOf(i)>=0)
		{
			wheel[i] = { icon: ':red_circle:', number:i, color: 'red' };
		}
		else
		{
			wheel[i] = { icon: ':black_circle:', number:i, color: 'black' };
		}
	}
	wheel.shuffle();
} 

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

function spinWheel(bot, message){
	bot.reply(message, 'The ball stops on ' + wheel[0].number +' '+ wheel[0].icon);
	var even = (wheel[0].number % 2)==0;
	var hasWinner = false;
	for(var j=0; j<bets.length; j++)
	{
		if(bets[j].bet == wheel[0].number)
		{
			hasWinner = true;
			winner(bot, message, bets[j]);
		}
		if(bets[j].bet =='even' && even)
		{
			hasWinner = true;
			winner(bot, message, bets[j]);
		}
		if(bets[j].bet =='red' && wheel[0].color =='red')
		{
			hasWinner = true;
			winner(bot, message, bets[j]);
		}
		if(bets[j].bet =='black' && wheel[0].color=='black')
		{
			hasWinner = true;
			winner(bot, message, bets[j]);
		}
	}
	if(!hasWinner)
	{
		bot.reply(message, 'Ha. No one won. Better luck next time, suckers!');
	}
	bets = [];
	betMode = false;
}

function winner(bot, message, bet)
{
	bot.reply(message, ':tada: Congratulations '+bet.profile+'! You won with "'+bet.bet+'"!');
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
