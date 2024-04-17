function unityprogress(gameinstance, progress) {
	if (!gameinstance.module) return;
	if (!gameinstance.logo) {
		gameinstance.logo = document.createelement('div');
		gameinstance.logo.classname = 'logo ' + gameinstance.module.splashscreenstyle;
		gameinstance.container.appendchild(gameinstance.logo);
	}
	if (!gameinstance.progress) {
		gameinstance.progress = document.createelement('div');
		gameinstance.progress.classname = 'progress ' + gameinstance.module.splashscreenstyle;
		gameinstance.progress.empty = document.createelement('div');
		gameinstance.progress.empty.classname = 'empty';
		gameinstance.progress.appendchild(gameinstance.progress.empty);
		gameinstance.progress.full = document.createelement('div');
		gameinstance.progress.full.classname = 'full';
		gameinstance.progress.appendchild(gameinstance.progress.full);
		gameinstance.container.appendchild(gameinstance.progress);
	}
	gameinstance.progress.full.style.width = 100 * progress + '%';
	gameinstance.progress.empty.style.width = 100 * (1 - progress) + '%';
	if (progress == 1) gameinstance.logo.style.display = gameinstance.progress.style.display = 'none';
}
