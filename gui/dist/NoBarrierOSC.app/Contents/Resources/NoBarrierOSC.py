import os
import subprocess
import time
import signal

from Tkinter import *
from threading import Thread

class App:

	thread = None
	dir = None

	def __init__(self, master):

		### control frame

		frame = Frame(master, bd=10)
	
		self.lb = Listbox(frame, height=5, bd=2, relief=SUNKEN)
		self.launch = Button(frame, text="Launch", command=self.launch)
		self.stop = Button(frame, text="Stop", command=self.stop)
		self.clear = Button(frame, text="Clear", command=self.clearText)

		self.populateListBox(self.lb)

		self.lb.grid(row=1, column=0, rowspan=3)
		self.launch.grid(row=1, column=1, padx=10)
		self.stop.grid(row=2, column=1, padx=10)
		self.clear.grid(row=3, column=1, padx=10)

		Label(frame, text="Available applications").grid(row=0, column=0)
		Label(frame, text="Configuration").grid(row=0, column=3)

		Label(frame, text="OSC server port").grid(row=1, column=2, sticky=E)
		self.oscServerPortText = Entry(frame, width=20, relief=SUNKEN, bd=2)
		self.oscServerPortText.grid(row=1, column=3, sticky=E, padx=5)
		self.oscServerPortText.insert(END, "8899")

		Label(frame, text="OSC client port").grid(row=2, column=2, sticky=E)
		self.oscClientPortText = Entry(frame, width=20, relief=SUNKEN, bd=2)
		self.oscClientPortText.grid(row=2, column=3, sticky=E, padx=5)
		self.oscClientPortText.insert(END, "8898")

		frame.pack()

		### logger frame

		textframe = Frame(master, bd=2, relief=SUNKEN)
		
		textframe.grid_rowconfigure(0, weight=1)
		textframe.grid_columnconfigure(0, weight=1)
		
		self.yscrollbar = Scrollbar(textframe)
		self.yscrollbar.grid(row=0, column=1, sticky=N+S)
		
		self.text = Text(textframe, wrap=WORD, bd=0,
		            yscrollcommand=self.yscrollbar.set)
		
		self.text.grid(row=0, column=0, sticky=N+S+E+W)
		
		self.yscrollbar.config(command=self.text.yview)
		
		textframe.pack()

		self.updateButtons()

	def clearText(self):
		self.text.delete(1.0, END)

	def populateListBox(self, listbox):
		slashes = 0
		for i in os.getcwd():
			if i == '/':
				slashes += 1

		if not self.dir:
			self.dir = ''
			for i in range(slashes):
				dirname = os.getcwd() + os.sep + self.dir + "js"
				if os.path.isdir(dirname):
					break
				else:
					self.dir = ".." + os.sep + self.dir

		dirname = os.getcwd() + os.sep + self.dir + "js"

		apps = [f for f in os.listdir(dirname) if os.path.isdir(os.path.join(dirname, f)) and not f.startswith('.') and f not in ('core', 'lib', 'model', 'network')]
		for app in apps:
			listbox.insert(END, app)

	def launch(self):
		app = self.lb.get(ACTIVE)
		if app:
			self.thread = NodeServer(app, self)
			self.thread.start()
			self.updateButtons()
			self.text.insert(END, "*** Launching %s ***\n" % app)

	def stop(self):
		if self.thread:
			self.thread.exit()
			self.thread = None;
			self.text.insert(END, "*** Stopping server ***\n")

		self.updateButtons()

	def updateButtons(self):
		if self.thread:
			self.lb.configure(state=DISABLED)
			self.launch.configure(state=DISABLED)
			self.stop.configure(state=NORMAL)
		else:
			self.lb.configure(state=NORMAL)
			self.launch.configure(state=NORMAL)
			self.stop.configure(state=DISABLED)
		


class NodeServer(Thread):
	def __init__(self, app, gui):
		Thread.__init__(self)
		self.app = app
		self.gui = gui
	
	def run(self):
		try:
			cmd = ["node", self.gui.dir + "js/%s/server.js" % self.app]

			oscServerPort = self.gui.oscServerPortText.get()
			oscClientPort = self.gui.oscClientPortText.get()

			if oscServerPort:
				cmd.append("-s%d" % int(oscServerPort))

			if oscClientPort:
				cmd.append("-c%d" % int(oscClientPort))

			p = subprocess.Popen(tuple(cmd),
				stdout = subprocess.PIPE,
				stderr = subprocess.STDOUT,
				close_fds = True)

			self.pid = p.pid

			while True:
				line = p.stdout.readline()
				if line != '':
					self.gui.text.insert(END, line)
					if self.gui.yscrollbar.get()[1] > 0.97:
						self.gui.text.yview(END)
				else:
					break

		except:

			raise

	def exit(self):
		os.kill(self.pid, signal.SIGKILL)


root = Tk()
root.title("NoBarrierOSC launcher")
root.resizable(0,0)

if (sys.platform != "win32") and hasattr(sys, 'frozen'):
	root.tk.call('console', 'hide')

app = App(root)

root.mainloop()
