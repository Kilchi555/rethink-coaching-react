import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Coaches from './Coaches';
import Testimonials from './Testimonials';

const Routes = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/about" component={About} />
        <Route path="/coaches" component={Coaches} />
        <Route path="/testimonials" component={Testimonials} />
      </Switch>
    </BrowserRouter>
  );
};

export default Routes;