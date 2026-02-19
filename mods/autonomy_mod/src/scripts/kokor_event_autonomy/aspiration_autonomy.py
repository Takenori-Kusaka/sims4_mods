"""
Kokor Aspiration Autonomy - Autonomous Aspiration Goal Completion

Detects each sim's current aspiration goals and boosts relevant
static commodities so sims autonomously work toward completing them.

Supported aspiration categories:
- Athletic: Bodybuilder, etc. -> fitness
- Creative: Painter Extraordinaire, Musical Genius, Bestselling Author -> art, music, writing
- Family: Big Happy Family, Super Parent -> social
- Food: Master Chef, Master Mixologist -> cooking
- Knowledge: Renaissance Sim, Nerd Brain -> logic, programming, reading
- Love: Soulmate, Serial Romantic -> social/romance
- Nature: Freelance Botanist, Outdoor Enthusiast -> gardening
- Popularity: Friend of the World, Party Animal -> social, charisma
- Fortune: Fabulously Wealthy -> career skills
- Deviance: Chief of Mischief -> mischief

Architecture:
- Zone injection via Zone.on_loading_screen_animation_finished
- Repeating alarm every 25 sim minutes
- Per-sim aspiration goal analysis with keyword mapping
- Dynamic commodity boosting based on active aspiration objectives
"""

import services
import sims4.log
import sims4.resources

logger = sims4.log.Logger('KokorAspirationAutonomy', default_owner='kokor')

_alarm_handle = None
_recently_boosted = set()


# --- Static Commodity IDs ---
COMMODITY_IDS = {
    'social': 16714,         # staticCommodity_Socialize
    'charisma': 16704,       # staticCommodity_SkillCharisma
    'cook': 105606,          # staticCommodity_SkillCooking
    'gourmet': 115776,       # staticCommodity_SkillGourmetCooking
    'fitness': 16707,        # staticCommodity_SkillFitness
    'mischief': 111720,      # staticCommodity_SkillMischief
    'art': 108831,           # staticCommodity_SkillPainting
    'guitar': 109847,        # staticCommodity_SkillGuitar
    'piano': 115777,         # staticCommodity_SkillPiano
    'violin': 115775,        # staticCommodity_SkillViolin
    'garden': 168145,        # staticCommodity_Gardening_DoGardeningThings
    'write': 109845,         # staticCommodity_SkillWriting
    'read': 24727,           # staticCommodity_ReadBook
    'logic': 25291,          # staticCommodity_SkillLogic
    'program': 115774,       # staticCommodity_SkillProgramming
    'handiness': 109842,     # staticCommodity_SkillHandiness
}


# --- Aspiration keyword to commodity mapping ---
# Maps aspiration/goal name keywords to (commodity_key, boost_amount)
ASPIRATION_KEYWORD_MAP = {
    # Athletic / Fitness
    'bodybuilder': [('fitness', 250)],
    'athletic': [('fitness', 200)],
    'fitness': [('fitness', 200)],
    'workout': [('fitness', 200)],
    'exercise': [('fitness', 200)],
    'jog': [('fitness', 150)],
    'push': [('fitness', 150)],  # push-ups
    'sit_up': [('fitness', 150)],
    'swim': [('fitness', 150)],
    'sport': [('fitness', 150)],

    # Creative - Painting
    'painter': [('art', 250)],
    'paint': [('art', 200)],
    'masterpiece': [('art', 250)],
    'canvas': [('art', 200)],
    'easel': [('art', 200)],
    'draw': [('art', 150)],
    'sketch': [('art', 150)],
    'sculpt': [('art', 200)],

    # Creative - Music
    'music': [('guitar', 200), ('piano', 200), ('violin', 150)],
    'musical': [('guitar', 200), ('piano', 200), ('violin', 150)],
    'guitar': [('guitar', 250)],
    'piano': [('piano', 250)],
    'violin': [('violin', 250)],
    'instrument': [('guitar', 200), ('piano', 200)],
    'sing': [('guitar', 150), ('social', 100)],
    'perform': [('guitar', 150), ('social', 100)],
    'concert': [('guitar', 200), ('piano', 200)],
    'melody': [('guitar', 150), ('piano', 150)],
    'compose': [('guitar', 200), ('piano', 200)],

    # Creative - Writing
    'author': [('write', 250)],
    'write': [('write', 200)],
    'book': [('write', 200), ('read', 100)],
    'novel': [('write', 250)],
    'publish': [('write', 250)],
    'manuscript': [('write', 200)],
    'story': [('write', 200)],
    'poem': [('write', 150)],

    # Food / Cooking
    'chef': [('cook', 250), ('gourmet', 200)],
    'cook': [('cook', 200)],
    'culinary': [('cook', 200), ('gourmet', 200)],
    'meal': [('cook', 200)],
    'gourmet': [('gourmet', 250), ('cook', 150)],
    'bake': [('cook', 200)],
    'recipe': [('cook', 200)],
    'dish': [('cook', 200)],
    'food': [('cook', 150)],
    'mixolog': [('cook', 200)],  # mixologist / mixology
    'drink': [('cook', 150)],
    'bartend': [('cook', 150)],

    # Social / Family
    'friend': [('social', 250), ('charisma', 150)],
    'social': [('social', 200), ('charisma', 100)],
    'family': [('social', 200)],
    'parent': [('social', 200)],
    'child': [('social', 150)],
    'toddler': [('social', 150)],
    'relationship': [('social', 200), ('charisma', 100)],
    'companion': [('social', 200)],
    'talk': [('social', 150), ('charisma', 100)],
    'chat': [('social', 150)],
    'introduce': [('social', 150), ('charisma', 100)],
    'meet': [('social', 150)],
    'party': [('social', 200), ('charisma', 150)],
    'popularity': [('social', 250), ('charisma', 200)],
    'best_friend': [('social', 250)],

    # Romance
    'soulmate': [('social', 250), ('charisma', 150)],
    'romantic': [('social', 250)],
    'romance': [('social', 250)],
    'love': [('social', 200)],
    'date': [('social', 200)],
    'kiss': [('social', 200)],
    'flirt': [('social', 200), ('charisma', 100)],
    'woohoo': [('social', 200)],
    'marry': [('social', 250)],
    'wedding': [('social', 250)],
    'propose': [('social', 250)],
    'engage': [('social', 200)],

    # Knowledge / Logic
    'nerd': [('logic', 250), ('program', 150), ('read', 150)],
    'genius': [('logic', 250)],
    'logic': [('logic', 200)],
    'chess': [('logic', 200)],
    'renaissance': [('logic', 150), ('read', 150), ('art', 100), ('cook', 100)],
    'research': [('logic', 200), ('read', 150)],
    'study': [('read', 200), ('logic', 150)],
    'learn': [('read', 200), ('logic', 100)],
    'homework': [('read', 200)],
    'knowledge': [('logic', 200), ('read', 200)],
    'read': [('read', 200)],
    'science': [('logic', 200)],
    'experiment': [('logic', 200)],
    'discover': [('logic', 150)],

    # Technology / Programming
    'computer': [('program', 250)],
    'program': [('program', 250)],
    'hack': [('program', 200)],
    'code': [('program', 200)],
    'tech': [('program', 200), ('logic', 100)],
    'robot': [('program', 200), ('handiness', 150)],
    'video_game': [('program', 150)],

    # Nature / Gardening
    'botanist': [('garden', 250)],
    'garden': [('garden', 200)],
    'plant': [('garden', 200)],
    'harvest': [('garden', 200)],
    'flower': [('garden', 150)],
    'outdoor': [('fitness', 150), ('garden', 100)],
    'nature': [('garden', 150)],
    'fish': [('garden', 100)],  # outdoor hobby
    'collect': [('garden', 100)],
    'explore': [('fitness', 100)],

    # Handiness / Crafting
    'handiness': [('handiness', 250)],
    'handy': [('handiness', 200)],
    'fix': [('handiness', 200)],
    'repair': [('handiness', 200)],
    'upgrade': [('handiness', 200)],
    'build': [('handiness', 200)],
    'craft': [('handiness', 200), ('art', 100)],
    'woodwork': [('handiness', 250)],
    'knit': [('handiness', 150), ('art', 100)],
    'fabricat': [('handiness', 200)],

    # Mischief / Deviance
    'mischief': [('mischief', 250)],
    'prank': [('mischief', 200)],
    'trick': [('mischief', 200)],
    'trouble': [('mischief', 150)],
    'villain': [('mischief', 200)],
    'evil': [('mischief', 150)],
    'mean': [('mischief', 150), ('social', 50)],

    # Career / Fortune
    'career': [('charisma', 150), ('logic', 100)],
    'wealth': [('charisma', 150)],
    'money': [('charisma', 100)],
    'promot': [('charisma', 150), ('logic', 100)],
    'job': [('charisma', 100)],
    'fortune': [('charisma', 150)],

    # General skill keywords
    'skill': [('logic', 100), ('read', 100)],
    'level': [('logic', 100)],
    'master': [('logic', 100)],
    'reach': [('logic', 50)],
}


def _is_sim_idle(sim):
    """Check if a sim is mostly idle."""
    try:
        if sim is None:
            return False
        queue = sim.queue
        if queue is not None and len(queue) > 2:
            return False
        return True
    except Exception:
        return True


def _boost_commodity(sim_info, commodity_id, amount=100):
    """Boost a static commodity for a sim to nudge autonomy."""
    try:
        stat_manager = services.get_instance_manager(
            sims4.resources.Types.STATISTIC
        )
        if stat_manager is None:
            return False
        commodity = stat_manager.get(commodity_id)
        if commodity is None:
            return False
        tracker = sim_info.statistic_tracker
        if tracker is None:
            return False
        stat = tracker.get_statistic(commodity, add=True)
        if stat is not None:
            current_val = stat.get_value()
            stat.set_value(current_val + amount)
            return True
    except Exception as e:
        logger.warn('Failed to boost commodity {}: {}', commodity_id, e)
    return False


def _match_keywords(text):
    """Match text against aspiration keyword map and return commodity boosts."""
    boosts = {}  # commodity_key -> max_amount
    text_lower = text.lower().replace(' ', '_')
    for keyword, commodity_list in ASPIRATION_KEYWORD_MAP.items():
        if keyword in text_lower:
            for commodity_key, amount in commodity_list:
                if commodity_key not in boosts or boosts[commodity_key] < amount:
                    boosts[commodity_key] = amount
    return boosts


def _get_aspiration_keywords(sim_info):
    """
    Detect the sim's current aspiration goals and return keyword strings.
    Analyzes aspiration name, milestone objectives, and whims/wants.
    """
    keywords = []
    try:
        tracker = sim_info.aspiration_tracker
        if tracker is None:
            return keywords

        # --- Source 1: Active aspirations ---
        try:
            active_aspirations = getattr(tracker, '_active_aspirations', None)
            if active_aspirations is None:
                active_aspirations = getattr(tracker, 'active_aspirations', {})

            if hasattr(active_aspirations, 'items'):
                aspiration_items = active_aspirations.items()
            elif hasattr(active_aspirations, '__iter__'):
                aspiration_items = [(a, None) for a in active_aspirations]
            else:
                aspiration_items = []

            aspiration_manager = services.get_instance_manager(
                sims4.resources.Types.ASPIRATION
            )

            for aspiration_id_or_key, aspiration_data in aspiration_items:
                try:
                    aspiration_id = aspiration_id_or_key
                    if hasattr(aspiration_id_or_key, 'guid64'):
                        aspiration_id = aspiration_id_or_key.guid64

                    # Get aspiration tuning instance
                    aspiration = None
                    if aspiration_manager is not None:
                        aspiration = aspiration_manager.get(aspiration_id)

                    if aspiration is not None:
                        # Get aspiration name
                        asp_name = ''
                        if hasattr(aspiration, '__name__'):
                            asp_name = str(aspiration.__name__)
                        elif hasattr(aspiration, 'display_name'):
                            asp_name = str(aspiration.display_name)
                        if asp_name:
                            keywords.append(asp_name)

                        # Get aspiration category
                        if hasattr(aspiration, 'category'):
                            cat = aspiration.category
                            if cat is not None:
                                cat_name = str(getattr(cat, '__name__', ''))
                                if cat_name:
                                    keywords.append(cat_name)

                except Exception:
                    continue

        except Exception as e:
            logger.debug('Could not read active aspirations: {}', e)

        # --- Source 2: Current milestone objectives ---
        try:
            # Try different API patterns for milestone access
            current_milestone = None
            if hasattr(tracker, 'active_milestone'):
                current_milestone = tracker.active_milestone
            elif hasattr(tracker, '_current_milestone'):
                current_milestone = tracker._current_milestone
            elif hasattr(tracker, 'get_current_milestone'):
                current_milestone = tracker.get_current_milestone()

            if current_milestone is not None:
                # Get milestone name
                ms_name = ''
                if hasattr(current_milestone, '__name__'):
                    ms_name = str(current_milestone.__name__)
                elif hasattr(current_milestone, 'display_name'):
                    ms_name = str(current_milestone.display_name)
                if ms_name:
                    keywords.append(ms_name)

                # Get objectives within the milestone
                objectives = None
                if hasattr(current_milestone, 'objectives'):
                    objectives = current_milestone.objectives
                elif hasattr(current_milestone, '_objectives'):
                    objectives = current_milestone._objectives

                if objectives is not None:
                    for objective in objectives:
                        try:
                            obj_name = ''
                            if hasattr(objective, 'display_name'):
                                obj_name = str(objective.display_name)
                            elif hasattr(objective, '__name__'):
                                obj_name = str(objective.__name__)
                            elif hasattr(objective, '__class__'):
                                obj_name = str(objective.__class__.__name__)

                            if obj_name:
                                keywords.append(obj_name)

                            # Also check the goal type class name for hints
                            class_name = str(objective.__class__.__name__)
                            if class_name:
                                keywords.append(class_name)

                        except Exception:
                            continue

        except Exception as e:
            logger.debug('Could not read milestone objectives: {}', e)

        # --- Source 3: Whims / Wants ---
        try:
            whim_tracker = None
            if hasattr(sim_info, 'whim_tracker'):
                whim_tracker = sim_info.whim_tracker
            elif hasattr(tracker, '_whimsets'):
                whim_tracker = tracker

            if whim_tracker is not None:
                active_whims = None
                if hasattr(whim_tracker, 'active_whims'):
                    active_whims = whim_tracker.active_whims
                elif hasattr(whim_tracker, '_active_whims'):
                    active_whims = whim_tracker._active_whims
                elif hasattr(whim_tracker, 'get_active_whims'):
                    active_whims = whim_tracker.get_active_whims()

                if active_whims is not None:
                    for whim in active_whims:
                        try:
                            if whim is None:
                                continue
                            whim_name = ''
                            if hasattr(whim, 'display_name'):
                                whim_name = str(whim.display_name)
                            elif hasattr(whim, '__name__'):
                                whim_name = str(whim.__name__)
                            if whim_name:
                                keywords.append(whim_name)
                        except Exception:
                            continue
        except Exception as e:
            logger.debug('Could not read whims/wants: {}', e)

    except Exception as e:
        logger.warn('Error getting aspiration keywords for {}: {}', sim_info, e)

    return keywords


def _compute_boosts(keywords):
    """Convert keyword list into commodity boost amounts."""
    combined = {}
    for text in keywords:
        boosts = _match_keywords(text)
        for key, amount in boosts.items():
            if key not in combined or combined[key] < amount:
                combined[key] = amount
    return combined


def _process_sim_aspiration(sim_info):
    """Process a single sim: detect aspirations and boost commodities."""
    try:
        sim = sim_info.get_sim_instance()
        if sim is None:
            return

        if not _is_sim_idle(sim):
            return

        sim_id = sim_info.sim_id
        if sim_id in _recently_boosted:
            return

        keywords = _get_aspiration_keywords(sim_info)
        if not keywords:
            return

        boosts = _compute_boosts(keywords)
        if not boosts:
            return

        # Apply boosts
        pushed = False
        for commodity_key, amount in boosts.items():
            commodity_id = COMMODITY_IDS.get(commodity_key)
            if commodity_id is not None:
                if _boost_commodity(sim_info, commodity_id, amount):
                    pushed = True

        if pushed:
            _recently_boosted.add(sim_id)
            logger.info(
                'Boosted aspiration commodities for sim {} (keywords: {}, boosts: {})',
                sim_info, keywords[:5], list(boosts.keys())
            )

    except Exception as e:
        logger.error('Error processing sim {} for aspiration: {}', sim_info, e)


def _check_aspiration_autonomy(alarm_handle):
    """Periodic callback: check aspirations for all active household sims."""
    try:
        _recently_boosted.clear()

        household = services.active_household()
        if household is None:
            return

        for sim_info in household.sim_info_gen():
            try:
                _process_sim_aspiration(sim_info)
            except Exception as e:
                logger.warn('Error checking sim {}: {}', sim_info, e)

    except Exception as e:
        logger.error('Error in aspiration autonomy check: {}', e)


def _setup_alarm():
    """Set up the repeating alarm for aspiration autonomy checks."""
    global _alarm_handle
    try:
        import alarms
        from date_and_time import create_time_span

        if _alarm_handle is not None:
            try:
                alarms.cancel_alarm(_alarm_handle)
            except Exception:
                pass
            _alarm_handle = None

        zone = services.current_zone()
        if zone is None:
            logger.warn('No current zone, cannot set up alarm')
            return

        _alarm_handle = alarms.add_alarm(
            zone,
            create_time_span(minutes=25),
            _check_aspiration_autonomy,
            repeating=True
        )
        logger.info('Aspiration Autonomy alarm registered (25 min interval)')

        # Run initial check
        _check_aspiration_autonomy(None)

    except Exception as e:
        logger.error('Failed to set up aspiration autonomy alarm: {}', e)


def _teardown_alarm():
    """Cancel the repeating alarm."""
    global _alarm_handle
    if _alarm_handle is not None:
        try:
            import alarms
            alarms.cancel_alarm(_alarm_handle)
        except Exception:
            pass
        _alarm_handle = None


# --- Zone injection for initialization ---
_original_on_loading_screen_finished = None


def _injected_on_loading_screen_finished(self, *args, **kwargs):
    """Injected into Zone.on_loading_screen_animation_finished."""
    result = _original_on_loading_screen_finished(self, *args, **kwargs)
    try:
        _setup_alarm()
    except Exception as e:
        logger.error('Error in zone load hook: {}', e)
    return result


def _inject():
    """Inject our zone load hook into the Zone class."""
    global _original_on_loading_screen_finished
    try:
        import zone
        _original_on_loading_screen_finished = zone.Zone.on_loading_screen_animation_finished
        zone.Zone.on_loading_screen_animation_finished = _injected_on_loading_screen_finished
        logger.info('Kokor Aspiration Autonomy: Zone injection successful')
    except Exception as e:
        logger.error('Failed to inject into Zone: {}', e)


# Module-level initialization
_inject()
logger.info('Kokor Aspiration Autonomy module loaded')
